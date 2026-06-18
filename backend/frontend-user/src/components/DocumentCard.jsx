const DocumentCard = ({ document }) => {
  return (
    <div className="doc-card">
      <h4>{document.idType?.toUpperCase() || 'DOCUMENT'}</h4>
      <p>{document.originalName || 'Uploaded file'}</p>
      <p className={`status ${document.status === 'verified' ? 'success' : 'pending'}`} style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>
        {document.status || 'Uploaded'}
      </p>
      {document.url && (
        <a className="link" href={document.url} target="_blank" rel="noreferrer">
          View file
        </a>
      )}
    </div>
  );
};

export default DocumentCard;
