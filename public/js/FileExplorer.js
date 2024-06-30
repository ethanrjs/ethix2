export class FileExplorer {
    constructor(fileSystem, container) {
        this.fileSystem = fileSystem;
        this.container = container;
        this.currentPath = '/';
        this.isVisible = false;
        this.init();
    }

    init() {
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.right = '0';
        this.container.style.width = '200px';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#1e1e1e';
        this.container.style.borderLeft = '1px solid #333';
        this.container.style.overflowY = 'auto';
        this.container.style.display = 'none';
        this.render();
    }

    render() {
        const contents = this.fileSystem.getDirectoryContents(this.currentPath);
        this.container.innerHTML = '';

        const header = document.createElement('div');
        header.textContent = this.currentPath;
        header.style.padding = '10px';
        header.style.borderBottom = '1px solid #333';
        this.container.appendChild(header);

        if (this.currentPath !== '/') {
            const upButton = this.createItem('..', 'folder', () =>
                this.navigateUp()
            );
            this.container.appendChild(upButton);
        }

        Object.entries(contents).forEach(([name, item]) => {
            const element = this.createItem(name, item.type, () =>
                this.navigate(name)
            );
            this.container.appendChild(element);
        });
    }

    createItem(name, type, onClick) {
        const element = document.createElement('div');
        element.textContent = name;
        element.style.padding = '5px 10px';
        element.style.cursor = 'pointer';
        element.style.display = 'flex';
        element.style.alignItems = 'center';

        const icon = document.createElement('span');
        icon.textContent = type === 'directory' ? '📁 ' : '📄 ';
        icon.style.marginRight = '5px';
        element.prepend(icon);

        element.onmouseover = () => {
            element.style.backgroundColor = '#333';
        };
        element.onmouseout = () => {
            element.style.backgroundColor = 'transparent';
        };
        element.onclick = onClick;
        return element;
    }

    navigate(name) {
        const newPath = this.fileSystem.resolvePath(
            `${this.currentPath}/${name}`
        );
        if (this.fileSystem.getDirectoryContents(newPath)) {
            this.currentPath = newPath;
            this.render();
        }
    }

    navigateUp() {
        const parentPath = this.fileSystem.resolvePath(
            `${this.currentPath}/..`
        );
        if (parentPath !== this.currentPath) {
            this.currentPath = parentPath;
            this.render();
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
        if (this.isVisible) {
            this.render();
        }
    }
}
