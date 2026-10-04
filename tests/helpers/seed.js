/**
 * Test database seeder.
 * Creates a fresh schema and two isolated tenants (Client A, Client B) plus a super admin.
 *
 * SAFETY: refuses to run unless TEST_ALLOW_DB_RESET=1, because it DROPS all tables.
 * Never point this at the production database.
 */
if (process.env.TEST_ALLOW_DB_RESET !== '1') {
  throw new Error('Refusing to reset DB: set TEST_ALLOW_DB_RESET=1 and use a dedicated test database.');
}

const db = require('../../src/models');

const PASSWORD = 'Test@12345';

async function seed({ candidatesPerClient = 30, scoresPerCandidate = 40 } = {}) {
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.sequelize.sync({ force: true });
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const superAcc = await db.Account.create({ username: 'super@test.com', password: PASSWORD, role: 'super admin' });
  const adminA = await db.Account.create({ username: 'admina@test.com', password: PASSWORD, role: 'admin' });
  const adminB = await db.Account.create({ username: 'adminb@test.com', password: PASSWORD, role: 'admin' });
  const staffAcc = await db.Account.create({ username: 'staffa@test.com', password: PASSWORD, role: 'staff' });
  await db.Account.create({ username: 'leadera@test.com', password: PASSWORD, role: 'staff' });
  await db.Account.create({ username: 'disabled@test.com', password: PASSWORD, role: 'staff' });

  const mkClient = (email, accountId, name) => db.Client.create({
    lastName: name, firstName: 'Exec', jobTitle: 'CEO', emailAddress: email, companyName: `${name} Corp`,
    status: 'Activate', accountId,
  });
  await mkClient('super@test.com', superAcc.id, 'Super');
  const clientA = await mkClient('admina@test.com', superAcc.id, 'Alpha');
  const clientB = await mkClient('adminb@test.com', superAcc.id, 'Beta');

  await db.Staff.create({
    lastName: 'Staff', firstName: 'A', jobTitle: 'Teacher', department: 'Ops', dateOfBirth: '1990-01-01',
    dateOfEmployment: '2020-01-01', contactNumber: '0000', emailAddress: 'staffa@test.com',
    accessLevel: 'Full Access', accountStatus: 'Enabled', clientId: clientA.id, accountId: adminA.id,
  });
  const staffBase = {
    lastName: 'Staff', jobTitle: 'Teacher', department: 'Ops', dateOfBirth: '1990-01-01',
    dateOfEmployment: '2020-01-01', contactNumber: '0000', clientId: clientA.id, accountId: adminA.id,
  };
  await db.Staff.create({ ...staffBase, firstName: 'Leader', emailAddress: 'leadera@test.com', accessLevel: 'Leaders Access', accountStatus: 'Enabled' });
  await db.Staff.create({ ...staffBase, firstName: 'Off', emailAddress: 'disabled@test.com', accessLevel: 'Full Access', accountStatus: 'Disabled' });
  await db.Staff.create({
    lastName: 'Staff', firstName: 'B', jobTitle: 'Teacher', department: 'Ops', dateOfBirth: '1990-01-01',
    dateOfEmployment: '2020-01-01', contactNumber: '0000', emailAddress: 'staffb@test.com',
    accessLevel: 'Full Access', accountStatus: 'Enabled', clientId: clientB.id, accountId: adminB.id,
  });

  const out = { clientA, clientB, units: {}, candidates: {}, blocks: {} };

  for (const [key, client, acc] of [['A', clientA, adminA], ['B', clientB, adminB]]) {
    const unit = await db.Unit.create({
      unitName: `Unit ${key}`, unitId: `U-${key}`, unitStartDate: '2025-01-01', unitDirector: 'Dir',
      unitType: 'Classroom', environment: 'Education', scoringSystem: '5-Point',
      accountId: acc.id, clientId: client.id,
    });
    out.units[key] = unit;

    const cands = [];
    for (let i = 0; i < candidatesPerClient; i++) {
      cands.push({
        lastName: `Last${i}`, firstName: `First${key}${i}`, dateOfBirth: '2000-01-01', startDate: '2025-01-01',
        nationality: 'LK', gender: i % 2 ? 'Male' : 'Female', maritalStatus: 'Single',
        accountId: acc.id, clientId: client.id,
      });
    }
    const created = await db.Candidate.bulkCreate(cands, { individualHooks: true });
    out.candidates[key] = created;

    await db.UnitRoster.bulkCreate(created.map((c) => ({ unitId: unit.id, candidateId: c.id })), { validate: false })
      .catch(() => null);

    const blocks = await db.AssessmentBlockManager.bulkCreate(created.map((c) => ({
      unitId: unit.id, candidate_id: c.id, manageType: 'Direct', ppId: 1, periodType: 'Week', delivery: 'Onsite',
      createdAt: new Date(), updatedAt: new Date(),
    })), { validate: false });
    out.blocks[key] = blocks;

    const scores = [];
    blocks.forEach((b, idx) => {
      for (let s = 0; s < scoresPerCandidate; s++) {
        scores.push({
          unitId: unit.id, assessmentBlockId: b.id, candidate_id: created[idx].id, ppId: 1 + (s % 5), subPpId: s,
          durationHrs: 1.5, criticalRefDate: new Date(Date.UTC(2025, 0, 1 + s)), attainedScore: (s % 5) + 1, maxScore: 5,
          competency: 'C', assessmentType: 'Quiz',
        });
      }
    });
    await db.InsertScore.bulkCreate(scores, { validate: false });
  }

  return { ...out, PASSWORD };
}

module.exports = { seed, PASSWORD };

if (require.main === module) {
  seed({
    candidatesPerClient: Number(process.env.SEED_CANDIDATES || 30),
    scoresPerCandidate: Number(process.env.SEED_SCORES || 40),
  })
    .then((r) => { console.log('Seeded. unitA=%d unitB=%d', r.units.A.id, r.units.B.id); return db.sequelize.close(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
