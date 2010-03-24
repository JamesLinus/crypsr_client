import libpry
from libcrypclient import utils


class ujsquote(libpry.AutoTree):
    def test_one(self):
        assert utils.jsquote("") == ""
        assert utils.jsquote("a") == "a"
        assert utils.jsquote(r'"') == r'\"'


tests = [
    ujsquote()
]



