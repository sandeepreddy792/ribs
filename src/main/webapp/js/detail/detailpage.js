var DetailPage = (function (_self) {
    _self.linkMap = {
        'pmc': 'https://europepmc.org/articles/{0}',
        'pmid': 'https://europepmc.org/abstract/MED/{0}',
        'doi': 'https://dx.doi.org/{0}',
        'chembl': 'https://www.ebi.ac.uk/chembldb/compound/inspect/{0}',
        'ega': 'https://www.ebi.ac.uk/ega/studies/{0}',
        'uniprot': 'http://www.uniprot.org/uniprot/{0}',
        'ena': 'https://www.ebi.ac.uk/ena/browser/view/{0}',
        'array design': window.contextPath + '/arrayexpress/studies/{0}',
        'arrayexpress files': window.contextPath + '/arrayexpress/studies/{0}/files/',
        'arrayexpress': 'https://www.ebi.ac.uk/arrayexpress/experiments/{0}',
        'dbsnp': 'http://www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?rs={0}',
        'pdbe': 'https://www.ebi.ac.uk/pdbe-srv/view/entry/{0}/summary',
        'pfam': 'http://pfam.xfam.org/family/{0}',
        'omim': 'http://omim.org/entry/{0}',
        'interpro': 'https://www.ebi.ac.uk/interpro/entry/{0}',
        'nucleotide': 'http://www.ncbi.nlm.nih.gov/nuccore/{0}',
        'geo': 'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc={0}',
        'intact': 'https://www.ebi.ac.uk/intact/pages/details/details.xhtml?experimentAc={0}',
        'biostudies': window.contextPath + '/studies/{0}',
        'biostudies title': window.contextPath + '/studies?first&query=title%3A%22{0}%22',
        'biostudies search': window.contextPath + '/studies?query={0}',
        'go': 'http://amigo.geneontology.org/amigo/term/{0}',
        'chebi': 'https://www.ebi.ac.uk/chebi/searchId.do?chebiId={0}',
        'bioproject': 'https://www.ncbi.nlm.nih.gov/bioproject/{0}',
        'biosamples': 'https://www.ebi.ac.uk/biosamples/samples/{0}',
        'chemagora': 'http://chemagora.jrc.ec.europa.eu/chemagora/inchikey/{0}',
        'compound': 'https://www.ebi.ac.uk/biostudies/studies/{0}',
        'rfam': 'http://rfam.org/family/{0}',
        'rnacentral': 'http://rnacentral.org/rna/{0}',
        'nct': 'https://clinicaltrials.gov/ct2/show/{0}',
        'expression atlas': 'https://www.ebi.ac.uk/gxa/experiments/{0}?ref=biostudies',
        'single cell expression atlas': 'https://www.ebi.ac.uk/gxa/sc/experiments/{0}?ref=biostudies',
        'idr': 'https://idr.openmicroscopy.org/search/?query=Name:{0}',
        'empiar': 'https://www.ebi.ac.uk/pdbe/emdb/empiar/entry/{0}/'
    };

    _self.reverseLinkMap = {
        '^europepmc.org/articles/(.*)': 'PMC',
        '^europepmc.org/abstract/MED/(.*)': 'PMID',
        '^dx.doi.org/(.*)': 'DOI',
        '^www.ebi.ac.uk/chembldb/compound/inspect/(.*)': 'ChEMBL',
        '^www.ebi.ac.uk/ega/studies/(.*)': 'EGA',
        '^www.uniprot.org/uniprot/(.*)': 'Sprot',
        '^www.ebi.ac.uk/ena/data/view/(.*)': 'ENA',
        '^www.ebi.ac.uk/arrayexpress/experiments/(.*)/files/': 'ArrayExpress Files',
        '^www.ebi.ac.uk/arrayexpress/experiments/(.*)': 'ArrayExpress',
        '^www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?rs=(.*)': 'dbSNP',
        '^www.ebi.ac.uk/pdbe-srv/view/entry/(.*)/summary': 'PDBe',
        '^pfam.xfam.org/family/(.*)': 'Pfam',
        '^omim.org/entry/(.*)': 'OMIM',
        '^www.ebi.ac.uk/interpro/entry/(.*)': 'InterPro',
        '^www.ncbi.nlm.nih.gov/nuccore/(.*)': 'RefSeq',
        '^www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=(.*)': 'GEO',
        '^dx.doi.org/(.*)': 'DOI',
        '^www.ebi.ac.uk/intact/pages/details/details.xhtml?experimentAc=(.*)': 'IntAct',
        '^www.ebi.ac.uk/biostudies/studies/(.*)': 'BioStudies',
        '^www.ebi.ac.uk/biostudies/studies/search.html?query=(.*)': 'BioStudies Search',
        '^amigo.geneontology.org/amigo/term/(.*)': 'GO',
        '^www.ebi.ac.uk/chebi/searchId.do?chebiId=(.*)': 'ChEBI',
        '^www.ncbi.nlm.nih.gov/bioproject/(.*)': 'BioProject',
        '^www.ebi.ac.uk/biosamples/samples/(.*)': 'BioSamples',
        '^rfam.org/family/(.*)': 'Rfam',
        '^rnacentral.org/rna/(.*)': 'RNAcentral',
        '^clinicaltrials.gov/ct2/show/(.*)': 'nct',
        '^www.ebi.ac.uk/gxa/experiments/(.*)': 'gxa',
        '^www.ebi.ac.uk/gxa/sc/experiments/(.*)': 'gxa-sc',
        '^idr.openmicroscopy.org/search/?query=Name:(.*)': 'idr',
        '^www.ebi.ac.uk/pdbe/emdb/empiar/entry/(.*)': 'empiar'
    };

    _self.linkTypeMap = { //sync with normalised-text
        'sprot': 'UniProt',
        'gen': 'ENA',
        'arrayexpress': 'ArrayExpress',
        'array design': 'Array Design',
        'geo': 'GEO',
        'ena': 'ENA',
        'refsnp': 'dbSNP',
        'pdb': 'PDBe',
        'pfam': 'Pfam',
        'omim': 'OMIM',
        'interpro': 'InterPro',
        'refseq': 'Nucleotide',
        'ensembl': 'Ensembl',
        'doi': 'DOI',
        'intact': 'IntAct',
        'chebi': 'ChEBI',
        'ega': 'EGA',
        '': 'External',
        'bioproject': 'BioProject',
        'biosample': 'BioSamples',
        'compound': 'Compound',
        'chemagora': 'ChemAgora',
        'rfam': 'Rfam',
        'rnacentral': 'RNAcentral',
        'nct': 'NCT',
        'gxa': 'Expression Atlas',
        'gxa-sc': 'Single Cell Expression Atlas',
        'idr': 'IDR',
        'empiar': 'EMPIAR',
        'biostudies': 'BioStudies'
    };

    _self.projectScripts = [
        {regex: /^E-*/, script: 'arrayexpress.js'},
        {regex: /^S-SCDT-*/, script: 'sourcedata.js'}
    ];

    return _self;
})(DetailPage || {});
