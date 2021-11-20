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
rules_version = '2';
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

As rules grow more complex, it's important to keep in mind where in the
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

The firebase rules env contains a bunch of helper functions and objects to
check for many things when validating an operation.

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

---

**Important to note that the global `resource` object is not equal to the
`request.resource` object.**

---

A common security practice is to check for data that we want to be immutable
with the data in the `request.resource` to make sure users do not make any
modifications:

```
allow write: if request.resource.data.username == resource.data.username;
```

## Common examples

### Allow only authenticated users to read user information

For social networks in which logging is necessary to navigate it:

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
[documentation](https://firebase.google.com/docs/firestore/security/get-started). Check it out!

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

## Functions

Useful to avoid code duplication in code. To define one:

```
function isLoggedIn() {

}
```

They have access to the variables in that scope. Usually you'll want to put
them at the same location as the root collection rules.

The "is logged in" condition can be transformed into a function like so:

```
function isLoggedIn() {
  return request.auth.uid != null;
}
```

(functions can return more than booleans, like maps or lists)

Another useful function would be to check if a document belong to the user that
made a request:

```
function belongsTo(userId) {
  return request.auth.uid == userId || request.auth.uid == resource.data.uid;
}
```

Rules version 2 also supports variables inside functions. For the
`canCreateTodo` function, we could use it like this:

```
function canCreateTodo() {
  let uid = request.auth.uid;
  let hasValidTimestamp = request.time == request.resource.data.createdAt;

  return belongsTo(uid) && hasValidTimestamp;
}
```

We can call functions inside functions, but the call stack is limited to 10.

The final result for all our rules with functions would look like this:

```
match /users/{userId} {
  allow read: if isLoggedIn();
  allow write: if belongsTo(userId);
}

match /todos/{docId} {
  allow read: if resource.data.status == 'published';

  allow create: if canCreateTodo();

  allow update: if canUpdateTodo()
}

function isLoggedIn() {
  return request.auth.uid != null;
}

function belongsTo(userId) {
  return request.auth.uid == userId || request.auth.uid == resource.data.uid;
}

function canCreateTodo() {
  let uid = request.auth.uid;
  let hasValidTimestamp = request.time == request.resource.data.createdAt;

  return belongsTo(uid) && hasValidTimestamp;
}

function canUpdateTodo() {
  let uid = request.auth.uid;
  let hasMutableKeys = request.resource.data.keys().hasOnly(['text','status'])

  return belongsTo(uid) && hasMutableKeys;
}
```

## Read other documents

Sometimes we might need more info than is available in either the `request` or
the `resource` objects. For instance, in case a user is banned for not
following the community guidelines.

When banned, we add their user ID to the `banned` collection. And when
reveiving a request, we have to check if the uid is not in there.

Let's create rules, though, for a situtation in which users can only read docs
if they have a profile, and users can only write (create, update, delete) if
they are admins.

We can use two methods:

- `exists`: takes a path to a document and indicates if the document exists
- `get`: takes a path to a document and returns its data

These two functions count as database reads, so we will be billed for it. Use
with extra caution!

There're also two functions called `existsAfter` and `getAfter` meant to be
used in combination with atomic operations.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{docId} {
      allow create: if request.auth != null
                    &&
                    exists(/databases/$(database)/documents/users/$(request.auth.uid))

      allow delete: if request.auth != null
                    &&
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true
    }
  }
}
```

We first check the request object to potentially save us a read from the
database thanks to the shortcut using the `&&` operator. And a better approach
(with functions):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{docId} {
      allow create: if isLoggedIn() && hasProfile(request.auth.uid);

      allow delete: if isLoggedIn() && isAdmin(request.auth.uid)
    }

    functions isLoggedIn() {
      return request.auth != null;
    }

    functions hasProfile(uid){
      return exists(/databases/$(database)/documents/users/$(uid))
    }

    functions isAdmin(uid){
      return get(/databases/$(database)/documents/users/$(uid)).data.admin == true;
    }
  }
}
```

## Chat example

From the `Create a chat app in 7 minutes` video, the database is structred as
follows:

- `users`: one doc per registered user (one to one)
- `messages`: one per message, with the `text` of the message, a `createdAt`
  timestamp, the `uid` of the user, and a `photoURL`

### What did people exploit?

- message length: users created very long messages, so we need to validate the
  length of the `text` to be less than 255 characters
- spoofed user ID: requests from the frontend can be duplicated from Postman
  and data can be basically anything
- used future timestamps
- posted profanity: banned those users by creating a document in the `banned`
  collection and ID-ing that document with the user's ID (empty docs, so we
  only need to check for existence)

### The Rules

We first lockdown all documents in the database explicitly (not needed, but
it's nice to have that as a reminder):

```
match /{document=**} {
  allow read, write: if false;
}
```

Then the rules for the `messages` collections:

```
match /messages/{docId} {
  allow read: if request.auth.uid != null;
  allow create: if canCreateMessage();
}

function canCreateMessage() {
  let uid = request.auth.uid;
  let isSignedIn = uid != null;
  let isOwner = request.auth.uid == request.resource.data.uid;
  let isNotTooLong = request.resource.data.text.size() < 255;
  let isNow = request.time == request.resource.data.createdAt;

  return isSignedIn && isOwner && isNotTooLong && isNow && !isBanned(uid)
}

function isBanned (uid) {
  return exists(/databases/$(database)/documents/banned/$(uid));
}
```

We do not want any message to be deleted, so we use the `allow create`
condition to enforce that.

## Role-based authentication

We have a `users` collection. In the document we have a `roles` property, which
is an array of strings indicating the roles this user has. In such a situation,
it is very important that users cannot update their own roles.

We also have a `posts` collection. The documents in there have 4 fields:
`content`, `published` (if it should be visible), `createdAt` and `uid` (the
owner of the post).

The rules look like this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {

      allow read: if isSignedIn();
      allow update, delete: if hasAnyRole(['admin']);

    }

    match /posts/{postId} {
        allow read: if ( isSignedIn() && resource.data.published ) || hasAnyRole(['admin']);
        allow create: if isValidNewPost() && hasAnyRole(['author']);
        allow update: if isValidUpdatedPost() && hasAnyRole(['author', 'editor', 'admin']);
        allow delete: if hasAnyRole(['admin']);
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function hasAnyRole(roles) {
      return isSignedIn()
              && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(roles)
    }

    function isValidNewPost() {
      let post = request.resource.data;
      let isOwner = post.uid == request.auth.uid;
      let isNow = request.time == request.resource.data.createdAt;
      let hasRequiredFields = post.keys().hasAll(['content', 'uid', 'createdAt', 'published']);

      return isOwner && hasRequiredFields && isNow;
    }

    function isValidUpdatedPost() {
      let post = request.resource.data;
      let hasRequiredFields = post.keys().hasAny(['content', 'updatedAt', 'published']);
      let isValidContent = post.content is string && post.content.size() < 5000;

      return hasRequiredFields && isValidContent;
    }
  }
}
```

Let's break them down:

- `match /users/${userId}`:
  - read only if the user is singed in
  - updates and deletes can only be performed by admins
  - there are no create rules; the best way to do that is with a `firebase`
    Cloud Function
- `match /posts/{postId}`:
  - reads are allowed for all users if the post is published, and reads are
    always allowed for admins
  - create operations are only allowed if the post is valid and if the user has
    the `author` role
  - update operations are allowed only if the update is valid and if the user
    has at least one of `author`, `editor` or `admin` roles
  - delete operations can only be done by admins
