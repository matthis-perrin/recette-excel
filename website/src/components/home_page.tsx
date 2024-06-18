import {memo, useCallback, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import {styled} from 'styled-components';

import {FileProcessor} from '@src/components/file_processor';

const FileProcessorMemo = memo(FileProcessor);

export const HomePage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((newFiles: File[]) => {
    setFiles(files => [...files, ...newFiles]);
  }, []);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  return (
    <Wrapper>
      <DropZone {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Déposez vos fichiers ici...</p>
        ) : (
          <p>Déposez vos fichiers ici, ou cliquez pour sélectionner les fichiers</p>
        )}
      </DropZone>
      {files.map(file => (
        <FileProcessorMemo key={file.name} file={file} />
      ))}
    </Wrapper>
  );
};
HomePage.displayName = 'HomePage';

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const DropZone = styled.div`
  width: 100%;
  height: 100%;
  max-height: 350px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: dashed 4px #888;
  border-radius: 8px;
  font-size: 30px;
  text-align: center;
  color: #888;
  cursor: pointer;
  &:hover {
    color: #417541;
    border-color: #417541;
    background-color: #41754188;
  }
`;
