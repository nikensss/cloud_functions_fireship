# Security Master Course

Rules can be edited from the web console for firestore, storage and the RTDB.

The console provides a history of previously used rules and the Rules
Playground.

The Rules Playground allow for testing the rules, to make sure they are set up
correctly.

Unit tests for rules can also be set.

The Monitor Rules tab shows how the rules have been executed and the outcome of
the checks (allowed, denied, error).

## Syntax: Common Expression Language

Invented by Google.

Not used by the RTDB.

## Deploying Rules

```bash
firebase deploy --only firestore:rules
```

## Match

Firestore rules start with `service cloud.firestore` and by default it is
followed by a block that containts `match /databases/{database}/documents`,
which is boiler plate code that puts you at the root of the database:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

There are different types of matching patterns: single document match,
collection match, and a hierarchy of collections and subcollections.

### Single document match

Looks like `match /users/jeddf23`, where `users` is the name of a collection
and `jeffd23` is a document in that collection.

This is not so common. Most of the times, rules will apply to all documents in
specific collections.

### Collection match

Wrapping the document id in curly brackets will convert
it to a collection wide rule and the ID of the document can be used inside the
logic of the rule:

```
match /users/{docId} {
  allow read: if docId == 'something'
}
```

Event though reads are allowed in the `users/{docId}`, reads in its
subcollections of are not allowed.

### Hierarchy of collections and subcollections

We can use a wildcard operator to match all documents, subcollections and
documents in subcollections.

```
match /users/{docId=**} {
  allow read: if docId == 'something'
}
```

### Last notes on matching

As rules grow moew complex, it's important to keep in mind where in the
database tree we are, because it's really easy to place a `match` block in the
wrong place.

## Allow

Takes two arguments: what is allowed and when that is allowed:

```
allow <what> <under which conditions>
```

### What

Can be `read` or `write`:

- `read`: single documents and queries of multiple documents
  - `get`: single document
  - `list`: multiple documents
- `write`: create, update and delete operations
  - `create`: to write a new document
  - `update`: to write to an existing document
  - `delete`: to delete a document

```
match /users/{docId=**} {
  allow read, write;

  allow get;
  allow list;

  allow create;
  allow update;
  allow delete;
}
```

A practical case for distinguishing between `create`, `update` and `delete` is
situations in which users can update their profile but should not be allowed to
delete it. That should be done by an admin.

The keyword `allow` without a `<under which conditions>` resolves to allowing
the operation.

### Allow discrepancies

Rules look for the _FIRST_ allow. If it is allowed once, it doesn't matter if
it is not allowed somewhere else.

All operations are blocked by default, so rules come in to start allowing some.

## Conditions

The firebase rules env contains a buch of helper functions and objects to check
for many things when checking if an operation should be allowed.

### General syntax

It starts with an `if` keyword followed by a predicate. The following example
always evaluates to `false`:

```
allow create: if false;
```

A condition like this is not necessary because that's the default behavior.

The conditions can use the `&&` and the `||` operators.

### `request`

Represents the incoming data from the client side application.

- `request.auth`: JWT with the user's authentication credential from firebase
  auth (like user ID, email...)
- `request.resource`: the actual data the user is trying to write to the
  database
- `request.time`: the time the request is received
- `request.path`: path to the document
- `request.method`: the operation (`read`, `create`...)

### `resource`

Represents the data that already exists in the database. Important when the
operation is an `update` or a `delete`.

**_Important to note that the global `resource` object is not the
`request.resource` object._**

A common security practice is to check immutable data on the document with data
in the `request.resource` to make sure only that user can do modifications:

```
allow write: if request.resource.data.username == resource.data.username;
```

## Common examples

### Allow only authenticated users to read user information

For social networks in which only logging is necessary to navigate it:

```
match /users/{userId} {
  allow read: if request.auth.uid != null;
}
```

### Allow only the owner of a doc to write to it

From social networks as well, only the owner of the profile should be allowed
to write updates to it:

```
match /users/{userId} {
  allow read: if request.auth.uid != null;
  allow write: if request.auth.uid == userId;
}
```

### One to Many relationship

If we had a `todos` list, many `todos` documents would belong to one user. That
relationship is maintained by adding the `userId` (`uid`) to the `todos`
document (in this example, this `todos` collection is a root collection, not a
subcollection of `users`). Let's also assume that in order to read a document,
it must have a `status` of `published`.

In order to create documents, the `uid` in the document must match the one
coming from the request and the `time` of the request must equal the
`createdAt` in the incoming `request.resource` (which makes sure the data has
not been manipulated on the way here; very important to use the
`serverTimestamp` in the app's code to make sure this rule works well!).

In order to update a document, only the owner of the doc can do it. Also, if we
wanted to keep some fields immutable in the database, this is where we set
those conditions. To do that, we use the `keys()` method, which returns the
fields that are being updated, and we check that only specific ones are there
(only `text` and `status` can be updated).

The `data` object has many useful methods that are explained in detail in the
documentation. Check it out!

With all that, the final rule looks like:

```
match /todos/{docId} {
  allow read: if resource.data.status == 'published';

  allow create: if request.auth.uid == resource.data.uid
                && request.time == request.resource.data.createdAt;

  allow update: if request.auth.uid == resource.data.uid
                && request.resource.data.keys().hasOnly(['text', 'status'])
}
```
