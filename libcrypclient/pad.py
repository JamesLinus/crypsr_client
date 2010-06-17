import json, hashlib, re
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


class _App:
    CIPHERMARKER = "%%CIPHERMARKER%%"
    def getComponents(self, jsc, cssc, minimized):
        """
            Takes lists of Javascript and CSS resource specifications, and
            returns lists of corresponding data.
        """
        jslibs = []
        for i, exclusions in jsc:
            d = utils.data.read("components/%s.js"%i)
            d = snip(d, exclusions)
            jslibs.append(jsmin.jsmin(d) if minimized else d)
        css = []
        for i in cssc:
            d = utils.data.read("components/%s.css"%i)
            css.append(cssmin.cssmin(d) if minimized else d)
        return jslibs, css

    def bootstrap(self, template, jslibs, css, **kwargs):
        """
            Bootstraps an application template. Returns a cubictemp Template
            instance.
        """
        kwargs["css"] = css
        kwargs["jslibs"] = jslibs
        bootstrap = cubictemp.Template(template)
        bootstrap = unicode(bootstrap(**kwargs))
        return cubictemp.Template(unicode(bootstrap))


class Pad(_App):
    JSLIBS = [
        ("sjcl", []),
        ("jquery-1.4.2", []),
        ("jquery.simplemodal-1.3.5", []),
        ("jquery.ui.core", []),
        ("jquery.ui.widget", []),
        ("jquery.ui.mouse", []),
        ("jquery.hotkeys", []),
        ("jquery.ui.effects.core", []),
        ("jquery.ui.effects.pulsate", []),
        ("jquery.textarea-expander", []),
        ("jquery.wiggle", []),
        ("jquery.putCursorAtEnd.1.0", []),
        ("jquery.contextMenu", []),
        ("showdown", []),
        ("json2", []),
        ("list", []),
        ("pad", [])
    ]
    CSS = ["resetfontsbase", "pad", "list"]
    def __init__(self, domain, minimized, dev):
        self.domain = domain
        self.minimized, self.dev = minimized, dev
        jslibs, css = self.getComponents(self.JSLIBS, self.CSS, minimized)
        self.template = self.bootstrap(
            utils.data.read("components/pad.html"),
            jslibs,
            css,
            domain = self.domain,
            name = "@!name!@",
            data = self.CIPHERMARKER,
            writekey = "@!writekey!@",
            dev = dev,
            helpdialog = utils.data.read("components/help.html"),
        )
        
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


class Converter(_App):
    JSLIBS = [
        ("sjcl", []),
        ("jquery-1.4.2", []),
        ("json2", []),
        ("jscrypto", []),
        ("converter", [])
    ]
    CSS = ["resetfontsbase", "converter"]
    def __init__(self, domain, minimized, dev):
        self.domain = domain
        self.minimized, self.dev = minimized, dev
        jslibs, css = self.getComponents(self.JSLIBS, self.CSS, minimized)
        self.template = self.bootstrap(
            utils.data.read("components/converter.html"),
            jslibs,
            css,
            domain = self.domain,
            name = "@!name!@",
            data = self.CIPHERMARKER,
            writekey = "@!writekey!@",
            dev = dev,
        )
        
    def render(self, name, data):
        """
            Render an existing pad, with the specified name and data blob.
        """
        t = self.template(
                name=name,
                writekey="",
            )
        t = str(t).replace(self.CIPHERMARKER, utils.jsquote(data))
        return t
