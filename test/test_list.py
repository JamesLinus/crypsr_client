import os
import libpry
from libcrypclient import pad
import _utils


class TestTodo(_utils.TestApp):
    JSLIBS = [
        ("contrib/jquery-1.4.2", []),
        ("contrib/jquery.simplemodal-1.3.5", []),
        ("contrib/jquery.ui.core", []),
        ("contrib/jquery.ui.widget", []),
        ("contrib/jquery.ui.mouse", []),
        ("contrib/jquery.hotkeys", []),
        ("contrib/jquery.ui.effects.core", []),
        ("contrib/jquery.ui.effects.pulsate", []),
        ("contrib/jquery.textarea-expander", []),
        ("contrib/jquery.putCursorAtEnd.1.0", []),
        ("contrib/jquery.contextMenu", []),
        ("contrib/showdown", []),
        ("list", [])
    ]
    CSS = ["contrib/resetfontsbase", "pad", "list"]


class uTodo(libpry.AutoTree):
    def test_filled(self):
        data = r"""
        var data = [
            {txt: "one"},
            {txt: 
"two\n===\n\n\
* foo\n* bar\n* voing\n\n\
afterlist\n\
three\n----\
\n__one__ and _two_ and *three*.\n\
***\n\
[link](http:\/\/www.google.com)\n\n\
done"},
            {
                txt: "three\n\n* one\n* two\n* three\n",
                children: [
                    {txt: "leadin\n------\n\n one"},
                    {txt: "five"},
                    {
                        txt: "six",
                        children: [
                            {txt: "seven"}
                        ]
                    },
                ],
            },
            {txt: "eight"},
            {txt: "# h1\ntxt\n## h2\ntxt\n### h3\ntxt\n#### h4\ntxt\n##### h5\ntxt\n###### h6\ntxt\n"}
        ];
        """
        t = TestTodo()
        t.render(
            "list.html",
            "list-filled.html",
            data = data
         )


    def test_empty(self):
        data = r"""
        var data = [];
        """
        t = TestTodo()
        t.render(
            "list.html",
            "list-empty.html",
            data = data
         )


tests = [
    uTodo(),
]
