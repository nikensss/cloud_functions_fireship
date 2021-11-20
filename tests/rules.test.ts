import {
  assertFails,
  assertSucceeds,
  RulesTestContext,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { setup, teardown } from './helpers';

const mockUser = {
  uid: 'bob'
};

const mockData = {
  'users/bob': {
    roles: ['admin']
  },
  'posts/abc': {
    content: 'hello world',
    uid: 'alice',
    createdAt: null,
    published: false
  }
};

describe('Database rules', () => {
  let rulesTestEnv: RulesTestEnvironment | undefined;
  let authenticatedFirestore:
    | ReturnType<RulesTestContext['firestore']>
    | undefined;

  beforeAll(async () => {
    rulesTestEnv = await setup(mockData);
    const bob = rulesTestEnv.authenticatedContext(mockUser.uid);
    authenticatedFirestore = bob.firestore();
  });

  afterAll(async () => {
    if (rulesTestEnv) await teardown(rulesTestEnv);
  });

  test('deny when reading an unauthorized collection', async () => {
    if (!authenticatedFirestore)
      return fail('Could not create authenticatedContext');

    const ref = authenticatedFirestore.doc('unauthorized-collection/doc');
    expect(await assertFails(ref.get()));
  });

  test('allow admin to read unpublished posts', async () => {
    if (!authenticatedFirestore)
      return fail('Could not create authenticatedContext');

    const ref = authenticatedFirestore.doc('posts/abc');
    expect(await assertSucceeds(ref.get()));
  });

  test('allow admin to update posts of other users', async () => {
    if (!authenticatedFirestore)
      return fail('Could not create authenticatedContext');

    const ref = authenticatedFirestore.doc('posts/abc');
    expect(await assertSucceeds(ref.set({ published: true })));
  });
});
