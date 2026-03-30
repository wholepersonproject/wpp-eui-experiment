import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';
import { v4 as uuidV4 } from 'uuid';

const INPUT_PATH = 'input-data/hra_mapping_100.json';
// const INPUT_PATH = 'input-data/Glucose_Model_HRA_Mapping_v4.csv';
const OUTPUT_PATH = 'docs/rui_locations.jsonld';

function parseCsv(csvPath) {
  const result = Papa.parse(readFileSync(csvPath, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });

  return result.data;
}

async function getRuiLocation(iri) {
  const res = await fetch(`https://apps.humanatlas.io/api/v1/extraction-site?iri=${encodeURIComponent(iri)}`);
  if (res.ok && res.status !== 404 && res.headers.get('content-type') !== 'text/html') {
    const rui_location = await res.json();
    rui_location['sameAs'] = rui_location['@id'];
    rui_location['@id'] = `http://purl.org/ccf/1.5/${uuidV4()}`;
    rui_location.placement['@id'] = `${rui_location['@id']}_placement`;
    rui_location.placement.source = undefined;
    return rui_location;
  } else {
    throw new Error('Unable to locate rui_location:', block.rui_location);
  }
}

const ruiIds = {
  Male: 'https://purl.humanatlas.io/millitome/pancreas-male-uf/v1.0#1',
  Female: 'https://purl.humanatlas.io/millitome/pancreas-female-uf/v1.0#1',
};

async function formatModel(model, sex) {
  const rui_location = await getRuiLocation(ruiIds[sex]);
  return {
    '@id': `http://identifiers.org/biomodels.db/${model.Model_ID}#Donor_${sex}`,
    '@type': 'Donor',
    label: `${model.Model_Name}`,
    description: `${model.Anatomical_Structures}`,
    link: `https://biomodels.org/${model.Model_ID}`,
    sex,
    consortium_name: 'BioModels',
    provider_name: 'BioModels',
    provider_uuid: 'BioModels',
    samples: [
      {
        '@id': `http://identifiers.org/biomodels.db/${model.Model_ID}#Publication_${sex}`,
        '@type': 'Sample',
        label: `${model.Paper_Title}`,
        description: `Published ${model.Paper_Publication_Date}`,
        link: `${model.Paper_Link}`,
        sample_type: 'Tissue Block',
        rui_location,
        sections: [],
        section_count: 1,
        section_size: 1,
        section_units: 'millimeter',
      },
      {
        '@id': `http://identifiers.org/biomodels.db/${model.Model_ID}#WppMetadata_${sex}`,
        '@type': 'Sample',
        label: 'WPP Metadata',
        description: `Time Scale: ${model.Temporal_Scale}, Spatial Scale: ${model.Atlas_Scale}`,
        link: `https://wholepersonproject.github.io/wpp-eui-experiment/metadata#${model.Model_ID}`,
        sample_type: 'Tissue Block',
        rui_location,
        sections: [],
        section_count: 1,
        section_size: 1,
        section_units: 'millimeter',
      },
    ],
  };
}

// const models = parseCsv(INPUT_PATH);
const models = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));

const results = [];
for (const model of models) {
  results.push(await formatModel(model, 'Male'));
  results.push(await formatModel(model, 'Female'));
}
const jsonld = {
  '@context': 'https://hubmapconsortium.github.io/ccf-ontology/ccf-context.jsonld',
  '@graph': results,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(jsonld, null, 2));
