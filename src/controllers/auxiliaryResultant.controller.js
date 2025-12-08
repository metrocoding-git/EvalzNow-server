const { getInsertScoresByUnitAndCandidate } = require('./insertScore.controller');
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getUnitRostersByUnitIdAndCandidateId } = require('./unitRoster.controller');

exports.getAuxiliaryGraphData = async (req, res) => {
    try {
        const { unitId, candidate_id } = req.params;

        if (!unitId || !candidate_id) {
            return res.status(400).json({ message: "unitId and candidate_id are required" });
        }

        // ----------------------------------------------------
        // 1) CALL EXISTING INSERT SCORE CONTROLLER
        // ----------------------------------------------------
        const mockReq1 = { params: { unitId, candidate_id } };
        let insertScores = null;

        const mockRes1 = {
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                insertScores = data;
                return this;
            }
        };

        await getInsertScoresByUnitAndCandidate(mockReq1, mockRes1);

        if (!Array.isArray(insertScores) || insertScores.length === 0) {
            return res.status(404).json({ message: "No Insert Score data found" });
        }

        // ----------------------------------------------------
        // 2) NOW CALL COMPETENCY RATIO CONTROLLER
        // ----------------------------------------------------
        const mockReq2 = {
            query: { unitId, candidate_id }
        };
        let competencyData = null;

        const mockRes2 = {
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                competencyData = data;
                return this;
            }
        };

        await getPpCompetencyRatioMultipleCandidate(mockReq2, mockRes2);

        if (!competencyData || !competencyData.results) {
            return res.status(404).json({ message: "No competency ratio data found" });
        }

        const competencyResults = competencyData.results;


        const mockReq3 = { params: { unitId, candidateId: candidate_id } };
        let rosterData = null;

        const mockRes3 = {
            status(code) { this.statusCode = code; return this; },
            json(data) { rosterData = data; return this; }
        };

        await getUnitRostersByUnitIdAndCandidateId(mockReq3, mockRes3);

        // ----------------------------------------------------
        // FILTER ONLY POSITIVE PPIDs in InsertScores
        // ----------------------------------------------------
        const positiveRecords = insertScores.filter(r => r.ppId > 0);

        if (positiveRecords.length === 0) {
            return res.status(200).json({
                unitId,
                candidate_id,
                tenureData: [],
                rosterData,
                message: "No positive ppId found"
            });
        }

        // Day difference helper
        const dayDiff = (a, b) =>
            Math.ceil((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));

        // ----------------------------------------------------
        // GROUP INSERT SCORE RESULTS BY PPID
        // ----------------------------------------------------
        const groupByPpId = {};

        positiveRecords.forEach(rec => {
            if (!groupByPpId[rec.ppId]) groupByPpId[rec.ppId] = [];
            groupByPpId[rec.ppId].push(rec);
        });

        // ----------------------------------------------------
        // SELECT LATEST RECORD PER PPID
        // AND MATCH cumulativeDuration with Competency Ratio Data
        // ----------------------------------------------------
        const finalResponse = Object.keys(groupByPpId).map(ppId => {
            const records = groupByPpId[ppId];

            // Sort descending by criticalRefDate → latest first
            records.sort((a, b) =>
                new Date(b.criticalRefDate) - new Date(a.criticalRefDate)
            );

            const top = records[0]; // Latest one

            // FIND MATCHING ppId IN competency ratio results
            const competencyMatch = competencyResults.find(c => Number(c.ppId) === Number(ppId));

            return {
                ppId: Number(ppId),
                subPpId: top.subPpId,
                criticalRefDate: top.criticalRefDate,
                csdTenureDays: dayDiff(top.criticalRefDate, top.candidate.startDate),
                usdTenureDays: dayDiff(top.criticalRefDate, top.unit.unitStartDate),

                // Attach competency data if exists
                duration: competencyMatch.cumulativeDuration || null,
                Productivity_CSD: competencyMatch ? competencyMatch.Productivity_CSD : null,
                Productivity_USD: competencyMatch ? competencyMatch.Productivity_USD : null,
            };
        });

        // ----------------------------------------------------
        // FINAL OUTPUT
        // ----------------------------------------------------
        return res.status(200).json({
            unitId,
            candidate_id,
            rosterData,
            results: finalResponse
        });

    } catch (error) {
        console.error("Error in getAuxiliaryGraphData:", error);

        return res.status(500).json({
            message: "Error computing auxiliary graph data",
            error: error.message
        });
    }
};
