const DocumentCard = ({ document }) => {
  return (
    <div className="card">
      <h4>{document.idType?.toUpperCase() || 'Document'}</h4>
      <p>{document.originalName || 'Uploaded document'}</p>
      <p className={`status ${document.status === 'verified' ? 'success' : 'pending'}`}>
        {document.status ? document.status : 'Uploaded'}
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
