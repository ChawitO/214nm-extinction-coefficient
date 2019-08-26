function requestFastaFromUniprot(form) {
  const code = form.inputbox.value.replace(/[^0-9a-z]/gi, '');
  const url = `https://www.uniprot.org/uniprot/${code}.fasta`;

  fetch(url)
    .then(response => response.text())
    .then(txt => {
      txt = txt.replace(/^>.*/, '').replace(/[^a-z]/gi, '');
      document.querySelector('#js-peptide-sequence').value = txt;
  });
};
