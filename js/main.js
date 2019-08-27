const AminoAcid = function(name, threeCode, oneCode, coefficient, monoMass, avgMass) {
  this.name = name;
  this.threeCode = threeCode;
  this.oneCode = oneCode;
  this.coefficient = coefficient;
  this.monoMass = monoMass;
  this.avgMass = avgMass;
};

const aminoInfo = {
  ala: new AminoAcid('Alanine',       'Ala', 'A', 32,    71.03711,  71.0779),
  arg: new AminoAcid('Arginine',      'Arg', 'R', 102,   156.10111, 156.1857),
  asn: new AminoAcid('Asparagine',    'Asn', 'N', 136,   114.04293, 114.1026),
  asp: new AminoAcid('Aspartic Acid', 'Asp', 'D', 58,    115.02694, 115.0874),
  cys: new AminoAcid('Cysteine',      'Cys', 'C', 225,   103.00919, 103.1429),

  glu: new AminoAcid('Glutamic Acid', 'Glu', 'E', 78,    129.04259, 129.1140),
  gln: new AminoAcid('Glutamine',     'Gln', 'Q', 142,   128.05858, 128.1292),
  gly: new AminoAcid('Glycine',       'Gly', 'G', 21,    57.02146,  57.0513),
  his: new AminoAcid('Histidine',     'His', 'H', 5125,  137.05891, 137.1393),
  ile: new AminoAcid('Isoleucine',    'Ile', 'I', 45,    113.08406, 113.1576),

  leu: new AminoAcid('Leucine',       'Leu', 'L', 45,    113.08406, 113.1576),
  lys: new AminoAcid('Lysine',        'Lys', 'K', 41,    128.09496, 128.1723),
  met: new AminoAcid('Methionine',    'Met', 'M', 980,   131.04049, 131.1961),
  phe: new AminoAcid('Phenylalanine', 'Phe', 'F', 5200,  147.06841, 147.1739),
  pro: new AminoAcid('Proline',       'Pro', 'P', 2675,  97.05276,  97.1152), // REMINDER, PROLINE HAS 2 COEFFICIENT VALUES

  ser: new AminoAcid('Serine',        'Ser', 'S', 34,    87.03203,  87.0773),
  thr: new AminoAcid('Threonine',     'Thr', 'T', 41,    101.04768, 101.1039),
  trp: new AminoAcid('Tryptophan',    'Trp', 'W', 29050, 186.07931, 186.2099),
  tyr: new AminoAcid('Tyrosine',      'Tyr', 'Y', 5375,  163.06332, 163.1733),
  val: new AminoAcid('Valine',        'Val', 'V', 43,    99.06841,  99.1311),

  nle: new AminoAcid('Norleucine',    'Nle', 'X', 45,    113.08406, 113.1576)
};

const aminoGroup = {
  acidic: ['asp', 'glu'],
  basic: ['arg', 'his', 'lys'],
  neutral: ['asn', 'cys', 'gln', 'ser', 'thr', 'trp', 'tyr'],
  nonPolar: ['ala', 'gly', 'ile', 'leu', 'met', 'phe', 'pro', 'val', 'nle']
};

function requestFastaFromUniprot(form) {
  const code = form.inputbox.value.replace(/[^0-9a-z]/gi, '');
  const url = `https://www.uniprot.org/uniprot/${code}.fasta`;

  fetch(url)
    .then(response => response.text())
    .then(txt => {
      txt = txt.replace(/^>.*/, '').replace(/[^a-z]/gi, '');
      main(txt);
  });
};

function main(sequence) {
  document.querySelector('#js-peptide-sequence').value = sequence;
  peptide = calculate(sequence);

  displayResult();
};

function calculate(sequence) {
  let peptide = {
    amount: sequence.length,
    avgMass: 0,
    monoMass: 0,
    molarExt: 0,
    mgmlExt: 0
  };
  for (let c of sequence) {
    const amino = Object.values(aminoInfo).find(e => e.oneCode === c)
    peptide.avgMass += amino.avgMass;
    peptide.monoMass += amino.monoMass;
    peptide.molarExt += amino.coefficient;

    let key = amino.threeCode.toLowerCase();
    peptide[key] ? peptide[key]++ : peptide[key] = 1;
  }
  // Add the peptide bonds value.
  peptide.molarExt += (sequence.length -1) * 923;

  if (sequence[0] === 'P') {
    //N-Terminal Proline has much lower coefficient
    peptide.molarExt += 30 - 2675;
  }

  peptide.avgMass = peptide.avgMass.toFixed(3);
  peptide.monoMass = peptide.monoMass.toFixed(3);
  peptide.mgmlExt = (peptide.molarExt / peptide.avgMass).toFixed(3);

  return peptide;
};

function displayResult() {
  const groupName = {
    acidic: 'Polar-Acidic',
    basic: 'Polar-Basic',
    neutral: 'Polar-Neutral',
    nonPolar: 'Non-Polar'
  };
  let useGroup = document.querySelector('#radio-group').checked;
  let display = document.querySelector('.amino-display');
  while (display.firstChild) {
    display.removeChild(display.firstChild);
  }

  document.querySelector('#js-avgMass').textContent = peptide.avgMass || 0;
  document.querySelector('#js-monoMass').textContent = peptide.monoMass || 0;
  document.querySelector('#js-mol').textContent = peptide.molarExt || 0;
  document.querySelector('#js-mgml').textContent = peptide.mgmlExt || 0;

  if (useGroup) {
    Object.keys(aminoGroup).forEach(key => {
      let wrapper = document.createElement('div');
      wrapper.setAttribute('class', `grid-wrapper grid-3-col`);
      let name = document.createElement('p');
      name.textContent = groupName[key];
      wrapper.appendChild(name);
      display.appendChild(wrapper);

      aminoGroup[key].forEach(makeAminoItem);
    });
  }
  else {
    Object.keys(aminoInfo).forEach(makeAminoItem);
  }

  document.querySelector('#js-aminoTotal').textContent = peptide.amount || 0;
}

function makeAminoItem(key) {
  let shouldHide = document.querySelector('#radio-hide').checked;
  let display = document.querySelector('.amino-display');
  // Skip if hiding absent amino acid
  if (shouldHide && !peptide[key]) {
    return;
  }
  let amino = aminoInfo[key];
  let wrapper = document.createElement('div');
  wrapper.setAttribute('class', `grid-wrapper grid-3-col`);

  let name = document.createElement('p');
  name.textContent = amino.name;
  wrapper.appendChild(name);

  let amount = document.createElement('p');
  amount.setAttribute('class', 'amino-amount');
  amount.textContent = peptide[key] || 0;
  wrapper.appendChild(amount);

  let mol = document.createElement('p');
  mol.setAttribute('class', 'amino-mol');
  mol.textContent = peptide[key] ? `${(peptide[key]/peptide.amount*100).toFixed(3)}%` : '-';
  wrapper.appendChild(mol);

  display.appendChild(wrapper);
};

var peptide = {};
document.querySelector('#radio-show').onclick = displayResult;
document.querySelector('#radio-hide').onclick = displayResult;
document.querySelector('#radio-alpha').onclick = displayResult;
document.querySelector('#radio-group').onclick = displayResult;

displayResult();
