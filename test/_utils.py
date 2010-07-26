import os, os.path, codecs
import libpry, cubictemp
from libcrypclient import utils, pad

OUTDIR = "browser"

testdata = utils.Data(__name__)


class TestPage(pad._App):
    JSLIBS = [
        ("contrib/jquery-1.4.2", []),
    ]
    CSS = []
    def transform(self, data):
        return data

    def render(self, src, dst, **kwargs):
        if not os.path.exists(OUTDIR):
            os.mkdir(OUTDIR)
        jslibs, css = self.getComponents(self.JSLIBS, self.CSS, False)
        self.template = self.bootstrap(
            unicode(testdata.read("data/%s"%src), "utf-8"),
            jslibs, css,
            **kwargs
        )
        f = codecs.open(os.path.join(OUTDIR, dst), "wb", "utf-8")
        f.write(self.transform(unicode(self.template)))


class TestApp(TestPage):
    JSLIBS = []
    CSS = []
    def render(self, src, dst, **kwargs):
        kwargs["listinclusion"] = utils.data.read("components/list.html")
        TestPage.render(
            self,
            src,
            dst,
            **kwargs
        )

