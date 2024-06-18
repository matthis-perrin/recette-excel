export function triggerDownload(opts: {
  contentType: string;
  content: string;
  fileName: string;
}): void {
  const {contentType, content, fileName} = opts;
  const element = document.createElement('a');
  element.setAttribute('href', `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', fileName);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
