// npm-installed modules
import fresh from "fresh-require";
import should from "should";


// module variables
let config = fresh("../config/default", require);


describe("lib/config", function() {
  it("exports an object", function() {
    should(config).be.an.Object();
  });
});


describe("lib/config.home", function() {
  it("defaults to ${FBRS_HOME} if set", function() {
    const home = "my home";
    process.env.FBRS_HOME = home;
    config = fresh("../config/default", require);
    should(config.home).eql(home);
    delete process.env.FBRS_HOME;
  });

  it("defaults to ${HOME} as last resort", function() {
    delete process.env.FBRS_HOME;
    config = fresh("../config/default", require);
    should(config.home).eql(process.env.HOME);
  });
});


describe("lib/config.ip", function() {
  it("defaults to ${FBRS_IP}", function() {
    const ip = "some ip";
    process.env.FBRS_IP = ip;
    config = fresh("../config/default", require);
    should(config.ip).eql(ip);
  });

  it("defaults to 127.0.0.1 as last resort", function() {
    delete process.env.FBRS_IP;
    config = fresh("../config/default", require);
    should(config.ip).eql("127.0.0.1");
  });
});


describe("lib/config.port", function() {
  it("defaults to ${FBRS_PORT}", function() {
    const port = 9352;
    process.env.FBRS_PORT = port;
    config = fresh("../config/default", require);
    should(config.port).eql(port);
  });

  it("defaults to 9432 as last resort", function() {
    delete process.env.FBRS_PORT;
    config = fresh("../config/default", require);
    should(config.port).eql(9432);
  });
});
