Got it ✅
Here’s a **concise quick-lookup doc** with the **flow** + **challenge schema**.

---

## 🔹 Game Initialization Flow

1. **Host creates challenge** → `WAITING_FOR_PLAYERS`.
2. **Challenger joins** → state = `LOBBY`.
3. **Lobby**:

   * Host → must click **START**.
   * Challenger → must mark **READY**.
   * Spectators → read-only.
4. **Start game** → `IN_PROGRESS`, problem assigned.
5. **Coding phase** → players submit → backend runs → broadcast results.
6. **Win condition** → first full pass (or best score) → `FINISHED`.

State machine:

```
WAITING_FOR_PLAYERS → LOBBY → IN_PROGRESS → FINISHED
```

---

## 🔹 Challenge Schema (Mongo, refs only)

```js
{
  _id: ObjectId(),
  gameId: "uuid-or-shortid",
  state: "WAITING_FOR_PLAYERS", // enum

  hostId: ObjectId("User"),
  challengerId: ObjectId("User"),
  spectators: [ ObjectId("User") ],

  problemId: ObjectId("Problem"),

  submissions: [
    {
      userId: ObjectId("User"),
      code: String,
      language: String,
      result: {
        passed: Number,
        failed: Number,
        status: "ACCEPTED" | "FAILED" | "ERROR"
      },
      timestamp: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

---

Do you want me to also add the **Mongoose schema definition** (with refs + enums) so you can drop it directly into code?
