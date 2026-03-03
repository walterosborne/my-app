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
    ScheduleID INT NOT NULL REFERENCES audits(scheduleid),
    SubcategoryID INT NOT NULL REFERENCES Subcategories(SubcategoryID),
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 3),
    PRIMARY KEY (ScheduleID, SubcategoryID)
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

-- Insert sample RiskRatings (20 records, 1-3 per audit)
INSERT INTO RiskRatings (ScheduleID, SubcategoryID, Rating) VALUES
(8176, 1, 2),
(8176, 4, 1),
(8176, 8, 3),
(8177, 2, 2),
(8177, 5, 2),
(8177, 11, 1),
(8178, 3, 3),
(8178, 6, 2),
(8179, 7, 1),
(8179, 9, 2),
(8179, 14, 3),
(8180, 10, 2),
(8180, 12, 1),
(8181, 13, 3),
(8181, 15, 2),
(8182, 16, 1),
(8182, 1, 2),
(8183, 4, 3),
(8184, 7, 2),
(8185, 11, 1);
