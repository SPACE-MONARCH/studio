import { collection, doc, writeBatch, Firestore } from 'firebase/firestore';
import { scenariosSeedData } from './scenarios';

export async function seedScenarios(db: Firestore) {
  const scenariosCollection = collection(db, 'scenarios');
  const batch = writeBatch(db);

  scenariosSeedData.forEach(scenario => {
    const docRef = doc(scenariosCollection, scenario.id);
    batch.set(docRef, scenario);
  });

  await batch.commit();
  console.log('Scenarios seeded successfully!');
}
