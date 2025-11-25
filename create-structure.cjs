const fs = require("fs");
const path = require("path");

const structure = {
  "": [
    "robots.txt",
    ".gitignore",
    "components.json",
    "eslint.config.js",
    "index.html",
    "package.json",
    "postcss.config.js",
    "README.md",
    "tailwind.config.ts",
    "tsconfig.app.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts"
  ],
  "src": {
    "": ["App.tsx", "index.css", "main.tsx", "vite-env.d.ts"],
    "components": {
      "ui": [
        "accordion.tsx","alert-dialog.tsx","alert.tsx","aspect-ratio.tsx","avatar.tsx","badge.tsx",
        "breadcrumb.tsx","button.tsx","calendar.tsx","card.tsx","carousel.tsx","chart.tsx",
        "checkbox.tsx","collapsible.tsx","command.tsx","context-menu.tsx","dialog.tsx","drawer.tsx",
        "dropdown-menu.tsx","form.tsx","hover-card.tsx","input-otp.tsx","input.tsx","label.tsx",
        "menubar.tsx","navigation-menu.tsx","pagination.tsx","popover.tsx","progress.tsx",
        "radio-group.tsx","resizable.tsx","scroll-area.tsx","select.tsx","separator.tsx","sheet.tsx",
        "sidebar.tsx","skeleton.tsx","slider.tsx","sonner.tsx","switch.tsx","table.tsx","tabs.tsx",
        "textarea.tsx","toast.tsx","toaster.tsx","toggle-group.tsx","toggle.tsx","tooltip.tsx",
        "use-toast.ts","AssinaturaDigital.tsx","DarkModeToggle.tsx","Layout.tsx","NavLink.tsx"
      ]
    },
    "hooks": ["use-mobile.tsx","use-toast.ts"],
    "lib": ["utils.ts"],
    "pages": [
      "Clientes.tsx","Cobranca.tsx","Dashboard.tsx","Emprestimos.tsx","Login.tsx","NotFound.tsx",
      "Notificacoes.tsx","ParcelasDetalhadas.tsx","RelatoriosAvancados.tsx"
    ],
    "types": ["index.ts","parcela.ts"],
    "utils": ["calculations.ts","notifications.ts","storage.ts"]
  }
};

function createStructure(base, obj) {
  for (const key in obj) {
    const currentPath = key === "" ? base : path.join(base, key);
    if (Array.isArray(obj[key])) {
      if (key !== "") fs.mkdirSync(currentPath, { recursive: true });
      obj[key].forEach(file => {
        const filePath = path.join(currentPath, file);
        fs.writeFileSync(filePath, "", "utf8");
      });
    } else {
      fs.mkdirSync(currentPath, { recursive: true });
      createStructure(currentPath, obj[key]);
    }
  }
}

const root = path.join(process.cwd());
createStructure(root, structure);
console.log("✅ Estrutura criada com sucesso!");
