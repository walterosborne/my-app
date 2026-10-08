import { registerFoeAuditRoutes } from './foeAuditRoutesOriginal.js';
import { registerNgatReadRoutes } from './ngatReadRoutes.js';
import { registerReferenceDataRoutes } from './referenceDataRoutes.js';

export const registerServerRoutes = (args) => {
    registerNgatReadRoutes(args);
    registerReferenceDataRoutes(args);
    registerFoeAuditRoutes(args);
};
