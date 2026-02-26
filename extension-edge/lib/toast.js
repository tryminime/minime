// Toast Notification System
export class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(options) {
        this.init();

        const {
            type = 'info', // success, error, info
            title = '',
            message = '',
            duration = 3000,
            icon = this.getIcon(type)
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close">×</button>
    `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        this.container.appendChild(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    static remove(toast) {
        toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    static success(message, title = 'Success') {
        return this.show({ type: 'success', title, message });
    }

    static error(message, title = 'Error') {
        return this.show({ type: 'error', title, message });
    }

    static info(message, title = 'Info') {
        return this.show({ type: 'info', title, message });
    }

    static warning(message, title = 'Warning') {
        return this.show({ type: 'warning', title, message });
    }
}

// Add CSS for toast slide-out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes toastSlideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`;
document.head.appendChild(style);
