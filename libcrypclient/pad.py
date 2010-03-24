import json, hashlib
import cubictemp
import utils, jsmin, cssmin

HOSTILEMARKER = "// APPHASH_HOSTILE_ZONE"


def hash(s, hex):
    """
        Calculates the SHA256 hash of a pad, excluding the hostile zone.
    """
    h = hashlib.sha256()
    hostile = hostileBlock(s, "")
    h.update(hostile)
    if hex:
        return h.hexdigest()
    else:
        return h.digest()


def hostileBlock(s, b):
    """
        Replace the hostile block in s with b.
    """
    hs = s.find(HOSTILEMARKER)
    he = s.rfind(HOSTILEMARKER)
    if hs < 0 or he < 0 or he == hs:
        return s
    return s[:hs] + b + s[he+len(HOSTILEMARKER):]


def snip(data, exclusions):
    """
        Exclusions must be non-overlapping. 
    """
    lines = data.splitlines()
    for i in sorted(exclusions, reverse=True):
        del lines[i[0]:i[1]+1]
    return "\n".join(lines)


class Pad:
    JSLIBS = [
        ("jquery-1.3.2", []),
        ("jquery.simplemodal-1.3.3", []),
        ("jscrypto", [
            # CCM
            (72, 72),
            (544, 846),
        ]),
        ("pad", [])
    ]
    CSS = ["resetfontsbase", "pad"]
    CIPHERMARKER = "%%CIPHERMARKER%%"
    def __init__(self, domain, minimized, dev):
        self.domain = domain
        self.minimized, self.dev = minimized, dev
        jslibs = []
        for i, exclusions in self.JSLIBS:
            d = utils.data.read("components/%s.js"%i)
            d = snip(d, exclusions)
            jslibs.append(jsmin.jsmin(d) if minimized else d)
        css = []
        for i in self.CSS:
            d = utils.data.read("components/%s.css"%i)
            css.append(cssmin.cssmin(d) if minimized else d)
        bootstrap = cubictemp.Template(utils.data.read("components/pad.html"))
        bootstrap = unicode(
                            bootstrap(
                                jslibs = jslibs,
                                css = css,
                                domain = self.domain,
                                name = "@!name!@",
                                data = self.CIPHERMARKER,
                                writekey = "@!writekey!@",
                                dev = dev
                            )
                        )
        self.template = cubictemp.Template(unicode(bootstrap))

    def existing(self, name, data):
        """
            Render an existing pad, with the specified name and data blob.
        """
        t = self.template(
                name=name,
                writekey="",
            )
        t = str(t).replace(self.CIPHERMARKER, utils.jsquote(data))
        return t

    def new(self, name, writekey):
        """
            Render a new pad, with the specified name and write key.
        """
        t = self.template(
                name=name,
                writekey=writekey,
            )
        t = str(t).replace(self.CIPHERMARKER, "")
        return unicode(t)
