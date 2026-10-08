import { registerFoeAuditRoutes } from './foeAuditRoutesOriginal.js';
import { registerNgatReadRoutes } from './ngatReadRoutes.js';

export const registerServerRoutes = (args) => {
    registerNgatReadRoutes(args);
    registerFoeAuditRoutes(args);
};
