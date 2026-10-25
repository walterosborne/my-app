# Archived NGAT SQL scripts

These scripts are retained for historical reference, one-off data maintenance, and exceptional database migrations. Archiving changes their repository locations only; it does not execute SQL or modify a database.

## Current schema copy

The maintained dbo-to-dev data copy script stays outside this folder:

- [`../copy-r-and-fode-between-schemas.sql`](../copy-r-and-fode-between-schemas.sql) — copies `_r` and `Fode*` tables from `dbo` to `dev` using `SELECT INTO`. It **drops existing matching target tables** and does not copy indexes, constraints, keys, triggers, defaults, or permissions.

## Historical SQL

- `kubernetes-script.sql` — consolidated Kubernetes-era migration and schema verification, retained for deliberate use following schema copies when constraints/defaults and normalized question/finding structures need restoration.
- `copy-dbo-to-dev.sql` — superseded `_r`-only copy script; unlike the maintained script, it does not include FOE tables and fails when target tables already exist.
- `non-schema-related/` — earlier setup and administrative SQL utilities, preserved in their own subfolder.
- Other `.sql` files here are archived migrations, backups, cleanup, and data-repair utilities.

**Before running any archived script:** review its schema targets, production safeguards, and applicability to the current database state. The scripts have not been rewritten or executed as part of this cleanup.
