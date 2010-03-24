import textwrap
import libpry
from libcrypclient import pad
import _utils

class usnip(libpry.AutoTree):
    def test_simple(self):
        data = "one\ntwo\nthree\nfour"

        ret = pad.snip(data, [(3, 3)])
        assert ret == "one\ntwo\nthree"

        ret = pad.snip(data, [(0, 1), (3, 3)])
        assert ret == "three"


class uPad(libpry.AutoTree):
    def test_simple(self):
        blob = "".join(chr(i) for i in range(255))
        l = pad.Pad("test", False, True)
        assert l.existing("name", blob)
        assert l.new("name", "blob")
        l = pad.Pad("test", False, False)
        assert l.existing("name", "blob")
        assert l.new("name", "blob")
        l = pad.Pad("test", True, False)
        assert l.existing("name", "blob")
        assert l.new("name", "blob")

    def test_hash(self):
        l = pad.Pad("test", False, True)
        assert pad.hash(l.existing("name", "blob"), True)
        assert pad.hash(l.existing("name", "blob"), False)

    def test_hostileBlock(self):
        ts = """
            pre
            %s
            inner
            %s
            post
        """
        ts = textwrap.dedent(ts)

        t = ts%(pad.HOSTILEMARKER, pad.HOSTILEMARKER)
        assert pad.hostileBlock(t, "") == '\npre\n\npost\n'

        t = ts%(pad.HOSTILEMARKER, "nomark")
        assert pad.hostileBlock(t, "") == t

        t = ts%("nomark", "nomark")
        assert pad.hostileBlock(t, "") == t

        ts = """
            pre
            %s
            %s 
            %s
            post
        """
        ts = textwrap.dedent(ts)%((pad.HOSTILEMARKER,)*3)
        assert pad.hostileBlock(ts, "") == '\npre\n\npost\n'


class uInjections(_utils.RenderTester):
    def test_padinjections(self):
        self._existingPad(
            "pad_domain.html",
            "<script>alert('hax');</script>",
            "<script>alert('hax');</script>",
            "<script>alert('hax');</script>",
        )


tests = [
    usnip(),
    uPad(),
    uInjections()
]


