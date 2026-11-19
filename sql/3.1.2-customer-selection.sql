/*
NGAT 3.1.2 — Customer selection and Internal/External standards classification.

Run manually against the NGAT audit database. Defaults to [dev].
Production changes require BOTH @TargetSchema = N'dbo' and @AllowDbo = 1.
No existing audit is assigned a customer automatically. Existing standard classifications
are preserved; newly added standardScope values remain NULL until an admin classifies them.
Rerunnable.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetSchema SYSNAME = N'dev';
DECLARE @AllowDbo BIT = 0;

IF @TargetSchema NOT IN (N'dev', N'dbo')
    THROW 50330, 'NGAT 3.1.2 supports only dev and dbo schemas.', 1;
IF @TargetSchema = N'dbo' AND @AllowDbo <> 1
    THROW 50331, 'Production changes require explicit @AllowDbo = 1.', 1;
IF SCHEMA_ID(@TargetSchema) IS NULL
    THROW 50332, 'Target schema does not exist.', 1;

DECLARE @Audits NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[audits_r]';
DECLARE @Customers NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[customers_r]';
DECLARE @Standards NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[standards_r]';
DECLARE @AuditsId INT = OBJECT_ID(@Audits, N'U');
IF @AuditsId IS NULL
    THROW 50333, 'audits_r does not exist in the selected schema.', 1;
DECLARE @StandardsId INT = OBJECT_ID(@Standards, N'U');
IF @StandardsId IS NULL
    THROW 50336, 'standards_r does not exist in the selected schema.', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(@Customers, N'U') IS NULL
    BEGIN
        EXEC (N'CREATE TABLE ' + @Customers + N' (
            [customerId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            [customerName] NVARCHAR(200) NOT NULL,
            [active] BIT NOT NULL CONSTRAINT [DF_customers_r_active] DEFAULT (1)
        );');
    END;

    DECLARE @CustomersId INT = OBJECT_ID(@Customers, N'U');
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @CustomersId AND name = N'customerId' AND system_type_id = TYPE_ID(N'int')
    ) OR NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @CustomersId AND name = N'customerName' AND system_type_id = TYPE_ID(N'nvarchar') AND max_length = 400
    ) OR NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @CustomersId AND name = N'active' AND system_type_id = TYPE_ID(N'bit')
    )
        THROW 50334, 'customers_r has an unexpected shape.', 1;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @AuditsId AND name = N'customerId' AND system_type_id <> TYPE_ID(N'int')
    )
        THROW 50335, 'Existing audits_r.customerId is not INT.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @AuditsId AND name = N'customerId'
    )
        EXEC (N'ALTER TABLE ' + @Audits + N' ADD [customerId] INT NULL;');

    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE parent_object_id = @AuditsId
          AND name = N'FK_audits_r_customers_r'
    )
        EXEC (N'ALTER TABLE ' + @Audits +
              N' WITH CHECK ADD CONSTRAINT [FK_audits_r_customers_r] FOREIGN KEY ([customerId]) REFERENCES ' +
              @Customers + N' ([customerId]);');

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @StandardsId AND name = N'standardScope'
    )
        EXEC (N'ALTER TABLE ' + @Standards + N' ADD [standardScope] NVARCHAR(8) NULL;');

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = @StandardsId AND name = N'standardScope'
          AND (system_type_id <> TYPE_ID(N'nvarchar') OR max_length <> 16)
    )
        THROW 50337, 'Existing standardScope column has an unexpected type or length.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = @StandardsId AND name = N'CK_standards_r_standardScope'
    )
        EXEC (
            N'ALTER TABLE ' + @Standards +
            N' WITH CHECK ADD CONSTRAINT [CK_standards_r_standardScope]' +
            N' CHECK ([standardScope] IS NULL OR [standardScope] IN (N''Internal'', N''External''));'
        );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

EXEC (N'SELECT [customerId], [customerName], [active] FROM ' + @Customers + N' ORDER BY [customerName];');
EXEC (N'SELECT [standardId], [standardName], [standardScope] FROM ' + @Standards + N' ORDER BY [standardName];');
