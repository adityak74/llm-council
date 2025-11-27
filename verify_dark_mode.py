import os

def check_file_content(filepath, search_strings):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            for s in search_strings:
                if s not in content:
                    print(f"❌ Missing '{s}' in {filepath}")
                    return False
            print(f"✅ Verified {filepath}")
            return True
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return False

def verify_dark_mode():
    print("Verifying Dark Mode Implementation...")
    
    # 1. Check index.css for variables
    check_file_content('frontend/src/index.css', [
        ':root {',
        '[data-theme=\'dark\'] {',
        '--bg-primary:',
        '--text-primary:'
    ])

    # 2. Check ThemeContext.jsx
    check_file_content('frontend/src/ThemeContext.jsx', [
        'createContext',
        'ThemeProvider',
        'localStorage.setItem(\'theme\''
    ])

    # 3. Check App.jsx
    check_file_content('frontend/src/App.jsx', [
        '<ThemeProvider>',
        '</ThemeProvider>'
    ])

    # 4. Check Sidebar.jsx
    check_file_content('frontend/src/components/Sidebar.jsx', [
        'useTheme',
        'toggleTheme',
        'theme === \'light\''
    ])

    # 5. Check CSS files for variables
    css_files = [
        'frontend/src/App.css',
        'frontend/src/components/Sidebar.css',
        'frontend/src/components/ChatInterface.css',
        'frontend/src/components/Stage1.css',
        'frontend/src/components/Stage2.css',
        'frontend/src/components/Stage3.css',
        'frontend/src/components/SettingsDialog.css',
        'frontend/src/components/NewConversationDialog.css',
        'frontend/src/components/PersonaManager.css'
    ]

    for css in css_files:
        check_file_content(css, ['var(--'])

if __name__ == "__main__":
    verify_dark_mode()
