import { PrismaClient } from "@prisma/client";


export const db = globalThis.prisma || new PrismaClient();

// This checks if a prisma instance already exists in the global scope.
// If globalThis.prisma exists, it is used to avoid creating multiple instances.



// In environments like Next.js, where hot module reloading (HMR) is enabled, creating multiple instances of PrismaClient can lead to issues like too many database connections. Storing the client in globalThis ensures that the same instance is reused instead of creating new ones.


if(process.env.NODE_ENV !== "production"){
    globalThis.prisma = db;
}


// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.