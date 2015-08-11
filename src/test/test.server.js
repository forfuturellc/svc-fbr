// npm-installed modules
import should from "should";


// own modules
import server from "../lib/server";


describe("lib/server", function() {
  it("has a valid API", function() {
    let checked = { };
    ["ping", "start", "stop", "query"].forEach(function(name) {
      should(server[name]).be.a.Function();
      checked[name] = true;
    });
    for (let name in server) {
      should(checked[name]).be.ok();
    }
  });
});



describe("lib/server.start", function() {
  const port = 5832;

  after(function(done) {
    server.stop({ port }, done);
  });

  it("starts a server", function(done) {
    server.start({ port }, function(startErr) {
      should(startErr).not.be.ok();
      server.ping({ port }, function(pingErr, res) {
        should(pingErr).not.be.ok();
        should(res.running).eql(true);
        return done();
      });
    });
  });
});


describe("lib/server.stop", function() {
  const port = 4923;

  beforeEach(function(done) {
    server.start({ port }, done);
  });

  afterEach(function(done) {
    server.stop({ port }, done);
  });

  it("stops a running server", function(done) {
    server.stop({ port }, function(stopErr) {
      should(stopErr).not.be.ok();
      server.ping({ port }, function(pingErr, res) {
        should(pingErr).not.be.ok();
        should(res.running).eql(false);
        return done();
      });
    });
  });

  it("ignores ECONNREFUSED error", function(done) {
    server.stop({ port: 5409 }, function(stopErr) {
      should(stopErr).not.be.ok();
      return done();
    });
  });
});


describe("lib/server.ping", function() {
  const port = 9753;

  before(function(done) {
    server.stop({ port }, done);
  });

  it("does not fail if server is not running", function(done) {
    server.ping({ port }, function(pingErr) {
      should(pingErr).not.be.ok();
      return done();
    });
  });

  it("returns running:false if server is not running", function(done) {
    server.ping({ port }, function(pingErr, res) {
      should(res.running).eql(false);
      return done();
    });
  });

  it("returns running:true if server is running", function(done) {
    const localPort = 8636;
    server.start({ port: localPort }, function(startErr) {
      should(startErr).not.be.ok();
      process.nextTick(function() {
        server.ping({ port: localPort }, function(pingErr, res) {
          should(pingErr).not.be.ok();
          should(res.running).eql(true);
          server.stop({ port: localPort });
          return done();
        });
      });
    });
  });
});


describe("lib/server.query", function() {
  const port = 9245;

  before(function(done) {
    server.start({ port }, done);
  });

  after(function(done) {
    server.stop({ port }, done);
  });

  it("does a query", function(done) {
    server.query({ port, path: __dirname }, function(err, res) {
      should(err).not.be.ok();
      should(res.isDirectory).eql(true);
      return done();
    });
  });
});
