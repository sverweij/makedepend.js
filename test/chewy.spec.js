var assert = require("assert");
var chewy  = require("../src/chewy.js");
var fs     = require("fs");
var tst    = require("./utl/testutensils");
var path   = require("path");

var OUT_DIR = "./test/output";
var FIX_DIR = "./test/fixtures";

var testPairs = [
    {
        description : "js-makedepend -f test/output/{{moduleType}}.dir.mk test/fixtures/{{moduleType}}",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.dir.mk")
        },
        expect      : "{{moduleType}}.dir.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -f test/output/{{moduleType}}.dir.mk test/fixtures/{{moduleType}}",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.dir.mk")
        },
        expect      : "{{moduleType}}.dir.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -f test/output/{{moduleType}}.file.mk test/fixtures/{{moduleType}}/root_one.js",
        dirOrFile   : "test/fixtures/{{moduleType}}/root_one.js",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.file.mk")
        },
        expect      : "{{moduleType}}.file.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -f test/output/{{moduleType}}.dir.filtered.mk -x node_modules test/fixtures/{{moduleType}}",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.dir.filtered.mk"),
            exclude   : "node_modules"
        },
        expect      : "{{moduleType}}.dir.filtered.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -f test/output/{{moduleType}}.dir.addedto.mk test/fixtures/{{moduleType}} - should just add",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.dir.addedto.mk"),
        },
        expect      : "{{moduleType}}.dir.addedto.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -f test/output/{{moduleType}}.dir.addedto.mk test/fixtures/{{moduleType}} - again; should have same result",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.dir.addedto.mk"),
        },
        expect      : "{{moduleType}}.dir.addedto.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -s '# NON-STANDARD DELIMITER' test/fixtures/{{moduleType}} - non-standard delimiter",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.dir.delimiter.mk"),
            delimiter : "# NON-STANDARD DELIMITER"
        },
        expect      : "{{moduleType}}.dir.delimiter.mk",
        cleanup     : true
    },
    {
        description : "js-makedepend -f test/output/{{moduleType}}.def.mk -d ALL_SRC test/fixtures/{{moduleType}}",
        dirOrFile   : "test/fixtures/{{moduleType}}",
        options     : {
            outputTo  : path.join(OUT_DIR, "{{moduleType}}.def.mk"),
            flatDefine: "ALL_SRC"
        },
        expect      : "{{moduleType}}.def.mk",
        cleanup     : true
    }
];

function resetOutputDir(){
    testPairs
    .filter(function(pPair){
        return pPair.cleanup;
    })
    .forEach(function(pPair){
        try {
            fs.unlinkSync(pPair.options.outputTo.replace("{{moduleType}}", "cjs"));
            fs.unlinkSync(pPair.options.outputTo.replace("{{moduleType}}", "amd"));
        } catch(e) {
            // process.stderr.write(typeof e);
        }
    });
    fs.writeFileSync(path.join(OUT_DIR, "cjs.dir.addedto.mk"), "Here is some content\nIt's not ended by a linebreak", "utf8");
    fs.writeFileSync(path.join(OUT_DIR, "amd.dir.addedto.mk"), "Here is some content\nIt's not ended by a linebreak", "utf8");
    try {
        fs.unlinkSync(path.join(OUT_DIR, "cjs.dir.stdout.mk"));
        fs.unlinkSync(path.join(OUT_DIR, "amd.dir.stdout.mk"));
    } catch(e) {
        // process.stderr.write(typeof e);
    }
}

function setModuleType(pTestPairs, pModuleType){
    return pTestPairs.map(function(pTestPair){
        var lRetval = {
            description: pTestPair.description.replace("{{moduleType}}", pModuleType),
            dirOrFile: pTestPair.dirOrFile.replace("{{moduleType}}", pModuleType),
            options: {
                outputTo: pTestPair.options.outputTo.replace("{{moduleType}}", pModuleType),
            },
            expect: pTestPair.expect.replace("{{moduleType}}", pModuleType),
            cleanup: pTestPair.cleanup
        };
        if (!!pTestPair.options.delimiter){
            lRetval.options.delimiter = pTestPair.options.delimiter;
        }
        if(!!pTestPair.options.exclude){
            lRetval.options.exclude = pTestPair.options.exclude;
        }
        if(!!pTestPair.options.flatDefine){
            lRetval.options.flatDefine = pTestPair.options.flatDefine;
        }
        return lRetval;
    });
}
function runFileBasedTests(pModuleType){
    setModuleType(testPairs, pModuleType).forEach(function(pPair){
        it(pPair.description, function(){
            chewy.main(pPair.dirOrFile, pPair.options);
            tst.assertFileEqual(
                pPair.options.outputTo, 
                path.join(FIX_DIR, pPair.expect)
            );
        });
    });    
}

describe('#chewy', function() {
    before("set up", function(){
        resetOutputDir();
    });
    
    after("tear down", function(){
        resetOutputDir();
    });
    
    describe("file based tests - commonJS", function(){
        runFileBasedTests("cjs");
    });
    
    describe("file based tests - AMD", function(){
        runFileBasedTests("amd");
    });
    
    describe("specials", function(){
        it("js-makedepend -f - test/fixtures/cjs - outputs to stdout", function() {
            var intercept = require("intercept-stdout");

            var lCapturedStdout = "";
            var unhook_intercept = intercept(function(pText) {
                lCapturedStdout += pText;
            });
            chewy.main("test/fixtures/cjs", {outputTo: "-"});
            unhook_intercept();
            fs.writeFileSync(
                path.join(OUT_DIR, "cjs.dir.stdout.mk"),
                lCapturedStdout,
                "utf8"
            );

            tst.assertFileEqual(
                path.join(OUT_DIR, "cjs.dir.stdout.mk"),
                path.join(FIX_DIR, "cjs.dir.stdout.mk")
            );
        });
        it("js-makedepend -f cjs.dir.wontmarch.mk this-doesnot-exist - non-existing generates an error", function() {
            var intercept = require("intercept-stdout");

            var lCapturedStdout = "";
            var unhook_intercept_stdout = intercept(function(pText) {
                // This space intentionally left empty
            });
            var unhook_intercept_stderr = intercept(function(pText) {
                lCapturedStdout += pText;
            });
            chewy.main("this-doesnot-exist", {outputTo: path.join(OUT_DIR, "cjs.dir.wontmarch.mk")});
            unhook_intercept_stdout();
            unhook_intercept_stderr();
            
            return assert.equal(
                lCapturedStdout,
                "ERROR: Can't open 'this-doesnot-exist' for reading. Does it exist?\n"
            );
        });
    });
});
