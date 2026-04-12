/**
 * Web Dev Playground - Integrated into Main App Layout
 * Interactive HTML, CSS, and JavaScript lessons
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

type Language = "html" | "css" | "js";

interface Lesson {
  title: string;
  sub: string;
  task: string;
  hint: string;
  code: string;
  preview?: string;
}

interface LessonData {
  [key: string]: Lesson[];
}

const lessonData: LessonData = {
  html: [
    {
      title: "Hello HTML",
      sub: "Your first webpage",
      task: "Change the heading to your name",
      hint: "Edit text inside the <h1> tag",
      code: `<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello, World!</h1>\n    <p>My first webpage using HTML.</p>\n  </body>\n</html>`,
    },
    {
      title: "Headings",
      sub: "h1 to h6 tags",
      task: "Add h4, h5, h6 headings below",
      hint: "Use <h4>, <h5>, <h6> tags",
      code: `<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Heading 1</h1>\n    <h2>Heading 2</h2>\n    <h3>Heading 3</h3>\n    <!-- add h4, h5, h6 here -->\n  </body>\n</html>`,
    },
    {
      title: "Links",
      sub: "Anchor tags",
      task: "Make the link open in a new tab",
      hint: 'Add target="_blank" to the <a> tag',
      code: `<!DOCTYPE html>\n<html>\n  <body>\n    <a href="https://google.com">Go to Google</a>\n    <br><br>\n    <a href="#">Another link</a>\n  </body>\n</html>`,
    },
    {
      title: "Lists",
      sub: "ul, ol, li",
      task: "Add 2 more items to the fruit list",
      hint: "Add <li> inside the <ul>",
      code: `<!DOCTYPE html>\n<html>\n  <body>\n    <h3>Fruits</h3>\n    <ul>\n      <li>Mango</li>\n      <li>Apple</li>\n    </ul>\n    <h3>Steps</h3>\n    <ol>\n      <li>Open editor</li>\n      <li>Write code</li>\n    </ol>\n  </body>\n</html>`,
    },
    {
      title: "Forms",
      sub: "input & button",
      task: "Add a password field below email",
      hint: '<input type="password" placeholder="Password">',
      code: `<!DOCTYPE html>\n<html>\n  <body>\n    <h2>Login</h2>\n    <form>\n      <input type="email" placeholder="Email"><br><br>\n      <!-- password field here -->\n      <button>Login</button>\n    </form>\n  </body>\n</html>`,
    },
    {
      title: "Clickable Pages",
      sub: "Navigation links",
      task: "Click the link to open my portfolio!",
      hint: 'Click the "View Portfolio" link to see it work!',
      code: `<!DOCTYPE html>\n<html>\n  <head>\n    <title>Home Page</title>\n    <style>\n      body { font-family: sans-serif; padding: 40px; background: #f0f0f0; }\n      .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.1); }\n      h1 { color: #333; }\n      .link { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }\n      .link:hover { background: #0052a3; }\n    </style>\n  </head>\n  <body>\n    <div class="container">\n      <h1>Welcome to My Portfolio!</h1>\n      <p>Click the link below to explore more pages.</p>\n      <a href="https://github.com" target="_blank" class="link">View Portfolio →</a>\n    </div>\n  </body>\n</html>`,
    },
  ],
  css: [
    {
      title: "Colors",
      sub: "color & background",
      task: "Change background to lightblue",
      hint: "body { background: lightblue; }",
      code: `body {\n  background: #f9f9f9;\n  font-family: sans-serif;\n  padding: 20px;\n}\nh1 { color: tomato; }\np  { color: #333; }`,
      preview: `<h1>Hello CSS!</h1><p>CSS makes things look beautiful.</p>`,
    },
    {
      title: "Box Model",
      sub: "margin, padding, border",
      task: "Add a 2px solid border to .box",
      hint: ".box { border: 2px solid navy; }",
      code: `.box {\n  width: 200px;\n  padding: 20px;\n  margin: 30px auto;\n  background: #e0f2fe;\n  text-align: center;\n}\np { font-family: sans-serif; }`,
      preview: `<div class="box"><p>I am a box!</p></div>`,
    },
    {
      title: "Flexbox",
      sub: "display: flex",
      task: "Add justify-content: center to .row",
      hint: ".row { justify-content: center; }",
      code: `.row {\n  display: flex;\n  gap: 12px;\n  padding: 20px;\n}\n.card {\n  background: #fef9c3;\n  padding: 20px 30px;\n  border-radius: 8px;\n  font-family: sans-serif;\n  font-weight: bold;\n}`,
      preview: `<div class="row"><div class="card">A</div><div class="card">B</div><div class="card">C</div></div>`,
    },
    {
      title: "Animations",
      sub: "@keyframes",
      task: "Change animation duration to 2s",
      hint: "animation: spin 2s linear infinite;",
      code: `@keyframes spin {\n  from { transform: rotate(0deg); }\n  to   { transform: rotate(360deg); }\n}\n.circle {\n  width: 60px;\n  height: 60px;\n  border-radius: 50%;\n  border: 6px solid #6366f1;\n  border-top-color: transparent;\n  animation: spin 1s linear infinite;\n  margin: 40px auto;\n}`,
      preview: `<div class="circle"></div>`,
    },
    {
      title: "Hover Effects",
      sub: "transitions",
      task: "Change hover background to coral",
      hint: ".btn:hover { background: coral; }",
      code: `.btn {\n  display: inline-block;\n  padding: 12px 28px;\n  background: #6366f1;\n  color: white;\n  border-radius: 8px;\n  font-family: sans-serif;\n  font-size: 15px;\n  cursor: pointer;\n  transition: all 0.3s;\n  margin: 30px;\n}\n.btn:hover {\n  background: #4f46e5;\n  transform: scale(1.05);\n}`,
      preview: `<div class="btn">Hover me!</div>`,
    },
  ],
  js: [
    {
      title: "Console Log",
      sub: "Your first JS",
      task: "Add console.log with your name",
      hint: 'console.log("Your Name")',
      code: `console.log("Hello from JS!");\nconsole.log("2 + 2 =", 2 + 2);\nconsole.log("ChaiCode is awesome");`,
    },
    {
      title: "Variables",
      sub: "let, const, var",
      task: "Create a variable for your age and log it",
      hint: "let age = 20;\nconsole.log(age);",
      code: `let name = "Hitesh";\nconst pi = 3.14;\nvar city = "Delhi";\n\nconsole.log("Name:", name);\nconsole.log("Pi:", pi);\nconsole.log("City:", city);`,
    },
    {
      title: "Functions",
      sub: "Define & call",
      task: "Make a function that adds two numbers",
      hint: "function add(a,b){ return a+b; }\nconsole.log(add(3,4));",
      code: `function greet(name) {\n  return "Namaste, " + name + "!";\n}\n\nconsole.log(greet("Rahul"));\nconsole.log(greet("Priya"));`,
    },
    {
      title: "Arrays",
      sub: "Lists in JS",
      task: "Push 2 more fruits and log the array",
      hint: 'fruits.push("Banana");\nconsole.log(fruits);',
      code: `let fruits = ["Apple", "Orange"];\n\nfruits.push("Grapes");\n\nconsole.log("Fruits:", fruits);\nconsole.log("Total:", fruits.length);\nconsole.log("First:", fruits[0]);`,
    },
    {
      title: "DOM Basics",
      sub: "getElementById",
      task: 'Change button text to "Clicked!" on click',
      hint: 'btn.textContent = "Clicked!";',
      code: `document.getElementById("myBtn").onclick = function() {\n  document.getElementById("msg").textContent = "Button was clicked!";\n  document.getElementById("msg").style.color = "green";\n};`,
      preview: `<button id="myBtn" style="padding:10px 20px;font-size:15px;cursor:pointer;border-radius:6px;border:1px solid #ccc">Click Me</button><p id="msg" style="font-family:sans-serif;margin-top:16px;font-size:15px"></p>`,
    },
  ],
};

export default function WebDevPlayground() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>("html");
  const [idx, setIdx] = useState(0);
  const [code, setCode] = useState(lessonData.html[0].code);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; msg: string }>>([]);
  const [completed, setCompleted] = useState<number[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const lessons = lessonData[lang];
  const currentLesson = lessons[idx];
  const colors = { html: "#f97316", css: "#38bdf8", js: "#facc15" };
  const files = { html: "index.html", css: "style.css", js: "script.js" };
  const badges = { html: "badge-html", css: "badge-css", js: "badge-js" };

  const makeConsoleShim = () => `<script>
(function(){
  function ser(v){
    if(v===null) return 'null';
    if(v===undefined) return 'undefined';
    if(typeof v==='object'){try{return JSON.stringify(v);}catch(e){return String(v);}}
    return String(v);
  }
  function send(type,args){
    window.parent.postMessage({source:'wdp-console',type:type,args:args.map(ser).join(' ')},'*');
  }
  var _c=window.console||{};
  window.console={
    log:function(){send('log',[].slice.call(arguments));_c.log&&_c.log.apply(_c,arguments);},
    error:function(){send('error',[].slice.call(arguments));_c.error&&_c.error.apply(_c,arguments);},
    warn:function(){send('warn',[].slice.call(arguments));_c.warn&&_c.warn.apply(_c,arguments);},
    info:function(){send('info',[].slice.call(arguments));_c.info&&_c.info.apply(_c,arguments);},
  };
  window.addEventListener('error',function(e){send('error',[e.message+' (line '+e.lineno+')']);});
})();
<\/script>`;

  // Listen for iframe console messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.data.source !== "wdp-console") return;
      setConsoleLogs((prev) => [
        ...prev,
        { type: e.data.type, msg: e.data.args },
      ]);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const updateLineNums = (codeText: string) => {
    return codeText.split("\n").length;
  };

  const runCode = () => {
    setConsoleLogs([]);
    if (!iframeRef.current) return;

    if (lang === "html") {
      iframeRef.current.srcdoc = makeConsoleShim() + code;
    } else if (lang === "css") {
      const preview = currentLesson.preview || "<h2>Preview</h2><p>CSS applied here.</p>";
      iframeRef.current.srcdoc = `<style>${code}</style>${preview}`;
    } else {
      const hasPreview = !!currentLesson.preview;
      if (hasPreview) {
        iframeRef.current.srcdoc =
          makeConsoleShim() +
          `<script>${code}<\/script>` +
          currentLesson.preview;
      } else {
        iframeRef.current.srcdoc =
          makeConsoleShim() + `<script>${code}<\/script>`;
      }
    }

    setCompleted((prev) => {
      if (!prev.includes(idx)) return [...prev, idx];
      return prev;
    });
  };

  const switchLang = (newLang: Language) => {
    setLang(newLang);
    setIdx(0);
    setCode(lessonData[newLang][0].code);
    setConsoleLogs([]);
    setCompleted([]);
  };

  const loadLesson = (i: number) => {
    setIdx(i);
    setCode(lessons[i].code);
    setConsoleLogs([]);
  };

  const resetCode = () => {
    setCode(currentLesson.code);
  };

  const showHint = () => {
    alert("Hint: " + currentLesson.hint);
  };

  const nextLesson = () => {
    setCompleted((prev) => {
      if (!prev.includes(idx)) return [...prev, idx];
      return prev;
    });

    if (idx < lessons.length - 1) {
      loadLesson(idx + 1);
    } else {
      const order: Language[] = ["html", "css", "js"];
      const ni = order.indexOf(lang) + 1;
      if (ni < order.length) {
        alert(`Complete! Chalte hain ${order[ni].toUpperCase()} pe!`);
        switchLang(order[ni]);
      } else {
        alert("Sab complete! Tu ab ek Web Developer hai! 🏆");
      }
    }
  };

  const lineCount = updateLineNums(code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      {/* Playground Container */}
      <div className="bg-[#0f1117] rounded-lg overflow-hidden border border-slate-700 flex flex-col h-[calc(100vh-150px)]">
        {/* Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-52 bg-[#161b22] border-r border-slate-700 flex flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-3 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <span>🌐</span>
                <span>Web Dev <span className="text-orange-500">Playground</span></span>
              </div>
            </div>

            {/* Language Tabs */}
            <div className="flex border-b border-slate-700 flex-shrink-0">
              {(["html", "css", "js"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    lang === l
                      ? `border-b-2 ${
                          l === "html"
                            ? "text-orange-500 border-orange-500"
                            : l === "css"
                            ? "text-cyan-400 border-cyan-400"
                            : "text-yellow-400 border-yellow-400"
                        }`
                      : "text-slate-500 border-transparent hover:text-slate-300"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Lesson List */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2 text-xs uppercase text-slate-500 font-semibold">
                {lang} Lessons
              </div>
              {lessons.map((lesson, i) => (
                <button
                  key={i}
                  onClick={() => loadLesson(i)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors border-l-2 flex items-center gap-2 ${
                    i === idx
                      ? `bg-slate-800 border-l-2 text-white`
                      : completed.includes(i)
                      ? "text-green-400 border-l-green-500"
                      : "text-slate-400 border-l-transparent hover:bg-slate-800 hover:text-slate-200"
                  }`}
                  style={
                    i === idx
                      ? { borderLeftColor: colors[lang] }
                      : completed.includes(i)
                      ? { borderLeftColor: "#22c55e" }
                      : {}
                  }
                >
                  <div className="flex-shrink-0 w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-xs">
                    {completed.includes(i) ? "✓" : ""}
                  </div>
                  <span>
                    {String(i + 1).padStart(2, "0")} {lesson.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="bg-[#161b22] border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-slate-100">
                {currentLesson.title} <span className="text-slate-500">— {currentLesson.sub}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetCode}
                  className="px-3 py-1 text-xs border border-slate-600 text-slate-400 rounded hover:text-slate-200 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={runCode}
                  className="px-3 py-1 text-xs rounded text-white font-bold transition-opacity hover:opacity-80"
                  style={{ background: colors[lang] }}
                >
                  ▶ Run
                </button>
              </div>
            </div>

            {/* Editor & Preview */}
            <div className="flex-1 flex overflow-hidden">
              {/* Editor Pane */}
              <div className="w-1/2 border-r border-slate-700 flex flex-col overflow-hidden">
                <div className="bg-[#0d1117] border-b border-slate-700 px-3 py-2 flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span>{files[lang]}</span>
                  <span
                    className="text-xs px-2 py-1 rounded font-bold"
                    style={{
                      background:
                        lang === "html"
                          ? "#43140720"
                          : lang === "css"
                          ? "#08304920"
                          : "#42200620",
                      color: colors[lang],
                    }}
                  >
                    {lang.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 overflow-hidden flex">
                  <div className="w-10 flex-shrink-0 bg-[#0d1117] border-r border-slate-700 text-right px-2 py-2 text-xs text-slate-600 font-mono overflow-hidden">
                    {Array.from({ length: lineCount })
                      .map((_, i) => String(i + 1))
                      .join("\n")}
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        setCode(
                          code.substring(0, start) +
                            "  " +
                            code.substring(end)
                        );
                      }
                    }}
                    className="flex-1 bg-[#0d1117] text-slate-100 border-none outline-none resize-none font-mono text-xs p-3 overflow-auto"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Right Pane */}
              <div className="w-1/2 flex flex-col overflow-hidden bg-[#0d1117]">
                {lang === "js" && currentLesson.preview ? (
                  <>
                    {/* Preview */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-[#0d1117] border-b border-slate-700 px-3 py-2 flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-slate-500" />
                          <div className="w-2 h-2 rounded-full bg-slate-500" />
                          <div className="w-2 h-2 rounded-full bg-slate-500" />
                        </div>
                        <span>Preview</span>
                      </div>
                      <iframe
                        ref={iframeRef}
                        className="flex-1 border-none bg-white"
                        sandbox={{ scripts: true } as any}
                      />
                    </div>
                    {/* Console */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-[#0d1117] border-t border-slate-700 px-3 py-2 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Console
                        </div>
                        <button
                          onClick={() => setConsoleLogs([])}
                          className="text-xs text-slate-500 hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {consoleLogs.length === 0 ? (
                          <div className="p-3 text-xs text-slate-600 font-mono">
                            Run your code to see output...
                          </div>
                        ) : (
                          consoleLogs.map((log, i) => (
                            <div
                              key={i}
                              className={`px-3 py-1 text-xs font-mono border-b border-slate-700 flex items-start gap-2 ${
                                log.type === "error"
                                  ? "bg-red-950 text-red-300"
                                  : log.type === "warn"
                                  ? "bg-yellow-950 text-yellow-300"
                                  : log.type === "info"
                                  ? "text-blue-300"
                                  : "text-slate-300"
                              }`}
                            >
                              <span className="text-slate-500 flex-shrink-0">
                                {log.type === "error"
                                  ? "✖"
                                  : log.type === "warn"
                                  ? "⚠"
                                  : "›"}
                              </span>
                              <span className="break-all">{log.msg}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Preview */}
                    <div className="bg-[#0d1117] border-b border-slate-700 px-3 py-2 flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                      </div>
                      <span>Preview</span>
                    </div>
                    <iframe
                      ref={iframeRef}
                      className="flex-1 border-none bg-white"
                      sandbox={{ scripts: true } as any}
                    />
                    {/* Console */}
                    {lang === "js" && (
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="bg-[#0d1117] border-t border-slate-700 px-3 py-2 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Console
                          </div>
                          <button
                            onClick={() => setConsoleLogs([])}
                            className="text-xs text-slate-500 hover:text-slate-300"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {consoleLogs.length === 0 ? (
                            <div className="p-3 text-xs text-slate-600 font-mono">
                              Run your code to see output...
                            </div>
                          ) : (
                            consoleLogs.map((log, i) => (
                              <div
                                key={i}
                                className={`px-3 py-1 text-xs font-mono border-b border-slate-700 flex items-start gap-2 ${
                                  log.type === "error"
                                    ? "bg-red-950 text-red-300"
                                    : log.type === "warn"
                                    ? "bg-yellow-950 text-yellow-300"
                                    : log.type === "info"
                                    ? "text-blue-300"
                                    : "text-slate-300"
                                }`}
                              >
                                <span className="text-slate-500 flex-shrink-0">
                                  {log.type === "error"
                                    ? "✖"
                                    : log.type === "warn"
                                    ? "⚠"
                                    : "›"}
                                </span>
                                <span className="break-all">{log.msg}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Task Bar */}
            <div className="bg-[#0d1117] border-t border-slate-700 px-4 py-3 flex items-center gap-4 flex-shrink-0">
              <span className="text-xs text-slate-500 flex-shrink-0">Task:</span>
              <span className="text-xs text-slate-200 flex-1">{currentLesson.task}</span>
              <button
                onClick={showHint}
                className="px-3 py-1 text-xs border border-slate-600 text-slate-400 rounded hover:text-slate-200 transition-colors flex-shrink-0"
              >
                Hint
              </button>
              <button
                onClick={nextLesson}
                className="px-3 py-1 text-xs border border-green-500 text-green-400 bg-green-950 rounded hover:bg-green-500 hover:text-white transition-colors flex-shrink-0 font-semibold"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
