# shopco-server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Clean Architecture
-> Entities 
-> Repository Interface 
-> Repository Implementation
-> Interactors or Usecase
-> Controller
-> Routes
-> Initialization
-> Entry point

Creation setup is top down, which means it starts from creating
and entities first, down to entry point or mostly in the Initialization.

While process starts from down "Entry point" up to "Entities"