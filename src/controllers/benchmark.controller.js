const db = require("../models");
const Benchmark = db.Benchmark;
const Unit = db.Unit;

// GET all benchmarks with unit info
exports.getBenchmarks = async (req, res) => {
  try {
    const benchmarks = await Benchmark.findAll({
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName', 'unitType']
      }],
      order: [
        ['unitId', 'ASC'],
        ['benchmarkRef', 'ASC']
      ]
    });
    res.status(200).json(benchmarks);
  } catch (error) {
    console.error("Error fetching benchmarks:", error);
    res.status(500).json({ 
      message: "Error fetching benchmarks", 
      error: error.message,
      suggestion: "Check if Unit-Benchmark association is properly set up"
    });
  }
};

// GET benchmark by ID with unit info
exports.getBenchmarkById = async (req, res) => {
  try {
    const { id } = req.params;
    const benchmark = await Benchmark.findByPk(id, {
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName', 'unitType']
      }]
    });

    if (!benchmark) {
      return res.status(404).json({ message: "Benchmark not found" });
    }

    res.status(200).json(benchmark);
  } catch (error) {
    console.error("Error fetching benchmark:", error);
    res.status(500).json({ 
      message: "Error fetching benchmark", 
      error: error.message 
    });
  }
};

// CREATE new benchmark(s) for a unit
exports.createBenchmark = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const benchmarksData = Array.isArray(req.body) ? req.body : [req.body];
    const createdBenchmarks = [];

    for (const data of benchmarksData) {
      const { unitId, ...benchmarkData } = data;

      // 🔑 Step 1: resolve Unit
      const unit = await Unit.findOne({
        where: { 
          [db.Sequelize.Op.or]: [
            { id: unitId },      // if numeric PK is passed
            { unitId: unitId }   // if string business code is passed
          ]
        },
        transaction
      });

      if (!unit) {
        await transaction.rollback();
        return res.status(404).json({ message: `Unit not found for: ${unitId}` });
      }

      // 🔑 Step 2: always use the PK for Benchmark FK
      const unitPk = unit.id;

      // 🔑 Step 3: get max benchmarkId for this unit
      const result = await Benchmark.findOne({
        where: { unitId: unitPk },
        attributes: [
          [db.sequelize.fn('MAX', db.sequelize.col('benchmarkId')), 'maxBenchmarkId']
        ],
        transaction,
        raw: true
      });

      const maxBenchmarkId = result?.maxBenchmarkId || 0;
      const nextBenchmarkId = maxBenchmarkId + 1;

      // 🔑 Step 4: create benchmark
      const newBenchmark = await Benchmark.create({
        unitId: unitPk, // always FK
        benchmarkId: nextBenchmarkId,
        ...benchmarkData
      }, { transaction });

      // Fetch with unit info
      const created = await Benchmark.findByPk(newBenchmark.id, {
        include: [{ model: Unit, as: "unit", attributes: ['id', 'unitId', 'unitName'] }],
        transaction
      });

      createdBenchmarks.push(created);
    }

    await transaction.commit();
    res.status(201).json(createdBenchmarks);

  } catch (error) {
    await transaction.rollback();
    console.error("Error creating benchmark(s):", error);
    res.status(500).json({
      message: "Error creating benchmark(s)",
      error: error.message,
      details: error.errors?.map(err => err.message)
    });
  }
};





// UPDATE a benchmark
exports.updateBenchmark = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { benchmarkRef, ...updateData } = req.body;

    const benchmark = await Benchmark.findByPk(id, { transaction });
    if (!benchmark) {
      await transaction.rollback();
      return res.status(404).json({ message: "Benchmark not found" });
    }

    // Update benchmark data (benchmarkRef can now be duplicated)
    await benchmark.update({
      benchmarkRef: benchmarkRef || benchmark.benchmarkRef,
      ...updateData
    }, { transaction });

    await transaction.commit();

    // Fetch updated benchmark with unit info
    const updatedBenchmark = await Benchmark.findByPk(id, {
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName']
      }]
    });

    res.status(200).json(updatedBenchmark);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating benchmark:", error);
    res.status(500).json({
      message: "Error updating benchmark",
      error: error.message,
      details: error.errors?.map(err => err.message)
    });
  }
};


// DELETE a benchmark
exports.deleteBenchmark = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const benchmark = await Benchmark.findByPk(id, { transaction });
    if (!benchmark) {
      await transaction.rollback();
      return res.status(404).json({ message: "Benchmark not found" });
    }

    await benchmark.destroy({ transaction });

    await Benchmark.update(
      { benchmarkId: db.sequelize.literal('benchmarkId - 1') }, // safer literal
      {
        where: {
          unitId: benchmark.unitId,
          benchmarkId: { [db.Sequelize.Op.gt]: benchmark.benchmarkId }
        },
        transaction
      }
    );

    await transaction.commit();

    res.status(200).json({ 
      message: "Benchmark deleted successfully",
      deletedBenchmarkId: id
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting benchmark:", error);
    res.status(500).json({ 
      message: "Error deleting benchmark", 
      error: error.message,
      suggestion: "Check if there are any dependencies preventing deletion"
    });
  }
};

