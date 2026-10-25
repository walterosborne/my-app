-- Create RiskFactors table
CREATE TABLE IF NOT EXISTS RiskFactors (
    RiskFactorID SERIAL PRIMARY KEY,
    RiskFactor VARCHAR(255) NOT NULL
);

-- Create Subcategories table  
CREATE TABLE IF NOT EXISTS Subcategories (
    SubcategoryID SERIAL PRIMARY KEY,
    RiskFactorID INT NOT NULL REFERENCES RiskFactors(RiskFactorID),
    SubCategory VARCHAR(255) NOT NULL
);

-- Create RiskRatings table
CREATE TABLE IF NOT EXISTS RiskRatings (
    RiskRatingID SERIAL PRIMARY KEY,
    ProcessArea VARCHAR(255) NOT NULL,
    Year INT NOT NULL,
    RiskTypeID INT NOT NULL,
    SectorID INT,
    DivisionID INT,
    SiteID INT,
    BUID INT,
    OUID INT,
    ProgramID INT,
    SubcategoryID INT NOT NULL REFERENCES Subcategories(SubcategoryID),
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 3)
);

-- Insert Risk Factors (5 factors)
INSERT INTO RiskFactors (RiskFactor) VALUES
('Process Complexity'),
('Personnel Competency'),
('Documentation Quality'),
('Equipment Reliability'),
('Regulatory Compliance');

-- Insert Subcategories (2-4 per risk factor, 16 total)
INSERT INTO Subcategories (RiskFactorID, SubCategory) VALUES
(1, 'Number of Process Steps'),
(1, 'Inter-departmental Dependencies'),
(1, 'Process Variability'),
(2, 'Training Level'),
(2, 'Experience Years'),
(2, 'Certification Status'),
(2, 'Turnover Rate'),
(3, 'Completeness'),
(3, 'Accessibility'),
(3, 'Currency'),
(4, 'Maintenance Schedule Adherence'),
(4, 'Equipment Age'),
(4, 'Failure Frequency'),
(5, 'Audit History'),
(5, 'Non-conformance Rate'),
(5, 'Corrective Action Effectiveness');

-- Insert sample RiskRatings
INSERT INTO RiskRatings (ProcessArea, Year, RiskTypeID, DivisionID, SubcategoryID, Rating) VALUES
('Number of Process Steps', 2026, 3, 1, 1, 2),
('Training Level', 2026, 3, 1, 4, 1),
('Completeness', 2026, 3, 1, 8, 3),
('Inter-departmental Dependencies', 2026, 3, 2, 2, 2),
('Experience Years', 2026, 3, 2, 5, 2),
('Maintenance Schedule Adherence', 2026, 3, 2, 11, 1);
