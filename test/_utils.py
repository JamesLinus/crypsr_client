import os, os.path
import libpry, cubictemp
from libcrypclient import utils, pad

OUTDIR = "browser"

class RenderTester(libpry.AutoTree):
    COMPONENTS = []
    def setUpAll(self):
        if not os.path.exists(OUTDIR):
            os.mkdir(OUTDIR)

    def _existingPad(self, fname, domain, name, data):
        f = open(os.path.join(OUTDIR, fname), "wb")
        l = pad.Pad(domain, False, False)
        f.write(l.existing(name, data))

    def _newPad(self, fname, domain, name, writekey):
        pass

    def _testFile(self, name, **kwargs):
        js = []
        for i in self.COMPONENTS:
            js.append(
                utils.data.read(
                    os.path.join("components", "%s.js"%i)
                )
            )
        kwargs["js"] = js
        t = cubictemp.File(os.path.join("templates", name), **kwargs)
        f = open(os.path.join(OUTDIR, name), "wb")
        f.write(t.raw().encode("latin-1"))

