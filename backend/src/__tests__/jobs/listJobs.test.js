const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter } = require("../setup/factories/userFactory");
const { createCompany } = require("../setup/factories/companyFactory");
const { createJob, createDraftJob, createExpiredJob } = require("../setup/factories/jobFactory");

describe("GET /api/v1/jobs", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should return only public active non-draft non-expired jobs", async () => {
    const r = await createRecruiter();
    const c = await createCompany(r._id);
    await createJob(r._id, c._id, { title: "Public Job" });
    await createDraftJob(r._id, c._id, { title: "Draft" });
    await createExpiredJob(r._id, c._id, { title: "Expired" });
    const res = await request(app).get("/api/v1/jobs").query({ limit: 20 });
    expect(res.status).toBe(200);
    const titles = (res.body.data?.jobs || []).map((j) => j.title);
    expect(titles).toContain("Public Job");
    expect(titles).not.toContain("Draft");
    expect(titles).not.toContain("Expired");
  });

  it("should return pagination metadata", async () => {
    const r = await createRecruiter();
    const co = await createCompany(r._id);
    await createJob(r._id, co._id, { title: "J1" });
    const res = await request(app).get("/api/v1/jobs").query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    const { pagination } = res.body.data;
    expect(Number(pagination.page)).toBe(1);
    expect(Number(pagination.limit)).toBe(10);
    expect(pagination.total).toEqual(expect.any(Number));
    expect(pagination.totalPages).toEqual(expect.any(Number));
  });

  it("should filter by location query param", async () => {
    const r = await createRecruiter();
    const c = await createCompany(r._id);
    await createJob(r._id, c._id, { title: "Berlin Role", location: "Berlin" });
    await createJob(r._id, c._id, { title: "Paris Role", location: "Paris" });
    const res = await request(app).get("/api/v1/jobs").query({ location: "Berlin", limit: 20 });
    expect(res.status).toBe(200);
    const titles = (res.body.data.jobs || []).map((j) => j.title);
    expect(titles.some((t) => t.includes("Berlin"))).toBe(true);
  });

  it("should return 422 when page is below minimum", async () => {
    const res = await request(app).get("/api/v1/jobs").query({ page: 0 });
    expect(res.status).toBe(422);
  });

  it("should return empty list gracefully when no jobs match", async () => {
    const res = await request(app).get("/api/v1/jobs").query({ q: "zzzznonexistentterm999" });
    expect(res.status).toBe(200);
    expect(res.body.data.jobs).toEqual([]);
  });
});
