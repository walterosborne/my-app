// Compatibility shim: mssqlserver.js still imports this module name.
// All non-FOE routes live in serverRoutes.js/ngatReadRoutes.js.
export { registerServerRoutes as registerFoeAuditRoutes } from './serverRoutes.js';
