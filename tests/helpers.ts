import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

export const setup = async (
  data: Record<
    string,
    Record<string, null | string | string[] | number | number[] | boolean | boolean[]>
  >
) => {
  const rulesTestEnv = await initializeTestEnvironment({
    projectId: 'cloud-functions-fireship-7327f',
    firestore: {
      host: 'localhost',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8')
    }
  });

  await rulesTestEnv.withSecurityRulesDisabled(async context => {
    // fill up database
    const db = context.firestore();
    for (const key in data) await db.doc(key).set(data[key]);
  });

  return rulesTestEnv;
};

export const teardown = async (rulesTestEnv: RulesTestEnvironment) => {
  if (!rulesTestEnv) return;

  await rulesTestEnv.clearFirestore();
  await rulesTestEnv.cleanup();
};
