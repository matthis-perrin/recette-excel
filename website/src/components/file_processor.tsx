import {XMLParser} from 'fast-xml-parser';
import {FC, useCallback, useEffect, useState} from 'react';
import {styled} from 'styled-components';

import {asArray, asMap, asString} from '@shared/lib/type_utils';

import {Button} from '@shared-web/components/core/button';
import {SvgIcon} from '@shared-web/components/core/svg_icon';
import {downloadIcon} from '@shared-web/components/icons/download_icon';
import {infoIcon} from '@shared-web/components/icons/info_icon';
import {triggerDownload} from '@shared-web/lib/download';

interface FileProcessorProps {
  file: File;
}

type ProcessorStatus =
  | {type: 'reading'}
  | {type: 'error'; err: unknown}
  | {type: 'parsing'; content: string}
  | {type: 'converting'; content: string; xml: Record<string, unknown>}
  | {
      type: 'success';
      content: string;
      xml: Record<string, unknown>;
      columns: string[];
      lines: Record<string, unknown>[];
    };

export const FileProcessor: FC<FileProcessorProps> = props => {
  const {file} = props;
  const [status, setStatus] = useState<ProcessorStatus>({type: 'reading'});
  const [errors, setErrors] = useState<{err: string}[]>([]);
  const [tableShown, setTableShown] = useState(false);

  useEffect(() => {
    // READING
    setStatus({type: 'reading'});
    file
      .text()
      .then(content => {
        // PARSING
        setStatus({type: 'parsing', content});
        setTimeout(() => {
          const parser = new XMLParser({ignoreAttributes: false});
          const xml = asMap(parser.parse(content), {});
          setStatus({type: 'converting', content, xml});
          // CONVERTING
          setTimeout(() => {
            const contentMap = asMap(xml['Content'], {});
            const body = asMap(contentMap['Body'], {});
            const retainVariable = asMap(body['RetainVariable'], {});
            const items = asArray(retainVariable['Item'], []);

            const columns: string[] = [];
            const lines: Record<string, unknown>[] = [];
            for (const item of items) {
              const itemMap = asMap(item, {});
              const nameStr = asString(itemMap['@_Name']);
              if (nameStr === undefined) {
                setErrors(curr => [...curr, {err: `Invalid item ${JSON.stringify(item)}`}]);
                continue;
              }
              //   const dataType = asString(itemMap['@_DataType']);
              const value = itemMap['Data'];
              const nameParse = /^.*\[(?<indexStr>\d+)\]\.(?<name>.*)$/u.exec(nameStr);
              const {indexStr, name} = nameParse?.groups ?? {};
              if (indexStr === undefined || name === undefined) {
                setErrors(curr => [...curr, {err: `Invalid name ${nameStr}`}]);
                continue;
              }
              const index = parseFloat(indexStr);
              if (!columns.includes(name)) {
                columns.push(name);
              }
              let line = lines[index];
              if (line === undefined) {
                line = {};
                lines[index] = line;
              }
              line[name] = value;
            }
            setStatus({type: 'success', xml, content, columns, lines});
          }, 0);
        }, 0);
      })
      .catch(err => {
        setStatus({type: 'error', err});
      });
  }, [file]);

  const handleDownloadClick = useCallback((): void => {
    if (status.type !== 'success') {
      return;
    }
    const csv = [
      status.columns.map(c => `"${c.replaceAll('"', '""')}"`).join(','),
      ...status.lines.map(l => [
        status.columns.map(c => `"${String(l[c]).replaceAll('"', '""')}"`),
      ]),
    ].join('\n');

    triggerDownload({
      contentType: 'text/csv',
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      fileName: `${file.name.endsWith('.xml') ? file.name.slice(0, -4) : file.name}.csv`,
      content: csv,
    });
    console.log(csv);
  }, [file.name, status]);

  const handleToggleClick = useCallback(() => {
    setTableShown(shown => !shown);
  }, []);

  return (
    <Wrapper>
      <Buttons>
        <Name>{file.name}</Name>
        <Status>{status.type}</Status>
        <Button onClick={handleDownloadClick} disabled={status.type !== 'success'}>
          <SvgIcon icon={downloadIcon} color="#ffffff" size={12} />
          &nbsp;&nbsp;Télécharger CSV
        </Button>
        <Button onClick={handleToggleClick} disabled={status.type !== 'success'}>
          <SvgIcon icon={infoIcon} color="#ffffff" size={12} />
          &nbsp;&nbsp;{tableShown ? 'Cacher' : 'Afficher'}
        </Button>
      </Buttons>
      {errors.map(({err}) => (
        <div key={err}>{err}</div>
      ))}
      {status.type === 'success' && tableShown ? (
        <TableWrapper>
          <Table>
            <thead>
              <Row>
                {status.columns.map(col => (
                  <HeaderCell key={col}>{col}</HeaderCell>
                ))}
              </Row>
            </thead>
            <tbody>
              {status.lines.map((line, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Row key={i}>
                  {status.columns.map(col => (
                    <Cell key={col}>{String(line[col])}</Cell>
                  ))}
                </Row>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      ) : status.type !== 'success' ? (
        <div>{status.type}</div>
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

FileProcessor.displayName = 'FileProcessor';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #ffffff10;
  border-radius: 8px;
  & > {
    flex-shrink: 0;
  }
`;

const Name = styled.div`
  flex-grow: 1;
`;
const Status = styled.div``;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border: solid 2px #666;
`;

const Table = styled.table`
  width: 100%;
`;
const Row = styled.tr`
  &:nth-child(even) {
    background-color: #ffffff22;
  }
`;
const HeaderCell = styled.th`
  padding: 4px 12px;
  background: #666;
  color: #ffffff;
  vertical-align: middle;
`;
// const HeaderNumberCell = styled(HeaderCell)`
//   text-align: right;
// `;
const Cell = styled.td`
  padding: 4px 12px;
  white-space: nowrap;
  vertical-align: middle;
`;
// const NumberCell = styled(Cell)`
//   text-align: right;
// `;
