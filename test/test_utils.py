# coding=utf-8
import libpry
from libcrypclient import utils
import _utils

class JSQPage(_utils.TestPage):
    def __init__(self, s):
        self.s = s
        
    def transform(self, data):
        return data
        

class ujsquote(libpry.AutoTree):
    def test_one(self):
        assert utils.jsquote("") == ""
        assert utils.jsquote("a") == "a"
        assert utils.jsquote(r'"') == r'\"'

    def test_browser(self):
        s = []
        for i in range(128):
            s += unichr(i)
        s = utils.jsquote("".join(s))
        t = JSQPage("")
        t.render(
            "jsquote.html",
            "jsquote.html",
            a = "".join([chr(i) for i in range(128)]),
            bin = s
        )



tests = [
    ujsquote()
]



