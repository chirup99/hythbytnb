import sys

file_path = 'client/src/pages/home.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Fix the specific logic block that caused the syntax error
old_snippet = """                              {!isVoiceActive && (
                                <>
                                  {localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && ("""

# The snippet in the file seems to have had an extra space or missing fragment
# Based on the last sed output, it looks like:
# {!isVoiceActive && (
#   <>
#     {localStorage.getItem('currentUserEmail')...

# Let's fix the nesting:
# {!isVoiceActive && (
#   <>
#     {...}
#     <button>...</button>
#     ...
#   </>
# )}

# I will replace the entire logic block from the start of Voice button to the end of the navigation div
# to ensure the fragments and parentheses are perfectly balanced.

import re

# Find the start of the Voice button
voice_btn_pattern = re.compile(r'<button\s+onClick=\{\(\)\s+=>\s+setIsVoiceActive\(!isVoiceActive\)\}')
match = voice_btn_pattern.search(content)

if match:
    start_pos = match.start()
    # Find the end of this nav group. 
    # It ends with </div> before {/* Mobile Greeting */} or similar.
    # But specifically, we added fragments.
    
    # Let's use a simpler string replacement for the exact broken structure
    
    # Broken structure identified from logs:
    # {!isVoiceActive && (
    #   <>
    #     {auth_check && (
    #        <button>...</button>
    #     )}
    #     <button>settings</button>
    #     ...
    #   </>
    # )}
    # </>  <-- EXTRA
    # )}   <-- EXTRA
    
    # Looking at the sed output:
    # 13674:                             </>
    # 13675:                           )}
    # 13676:                             </>
    # 13677:                           )}
    
    # I will replace the entire block from line 13600 to 13680 approx.
    
    lines = content.split('\n')
    
    # Rebuild the navigation section correctly
    nav_start_idx = -1
    for i, line in enumerate(lines):
        if 'data-testid="nav-voice"' in line:
            nav_start_idx = i
            break
            
    if nav_start_idx != -1:
        # Go back to find the opening <button for voice
        while nav_start_idx > 0 and '<button' not in lines[nav_start_idx]:
            nav_start_idx -= 1
        
        # Find the end of the navigation div
        nav_end_idx = nav_start_idx
        while nav_end_idx < len(lines) and '</div>' not in lines[nav_end_idx]:
            nav_end_idx += 1
            
        # The logic block we want to replace is within the space-y-3 flex flex-col div
        # Let's just find the closing tags we messed up.
        
        new_nav_content = """                              <button
                                onClick={() => setIsVoiceActive(!isVoiceActive)}
                                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-between"
                                data-testid="nav-voice"
                              >
                                <span>Voice</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isVoiceActive ? "rotate-180" : ""}`} />
                              </button>

                              {isVoiceActive && (
                                <div className="px-4 py-6 text-center text-gray-400 border border-dashed border-gray-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                                  Voice settings will appear here
                                </div>
                              )}

                              {!isVoiceActive && (
                                <>
                                  {localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (
                                    <button
                                      onClick={() => {
                                        setTabWithAuthCheck("dashboard");
                                        setIsNavOpen(false);
                                      }}
                                      className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                      data-testid="nav-dashboard"
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                      <span>dashboard</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setShowSettingsPanel(true)}
                                    className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2"
                                    data-testid="nav-settings"
                                  >
                                    <Settings className="h-4 w-4" />
                                    <span>setting & privacy</span>
                                  </button>
                                  <button
                                    onClick={toggleTheme}
                                    className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                    data-testid="nav-dark-theme"
                                  >
                                    {theme === 'dark' ? (
                                      <>
                                        <Sun className="h-4 w-4" />
                                        <span>light mode</span>
                                      </>
                                    ) : (
                                      <>
                                        <Moon className="h-4 w-4" />
                                        <span>dark mode</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await cognitoSignOut();
                                        localStorage.clear();
                                        window.location.href = "/login";
                                      } catch (error) {
                                        console.error("Logout error:", error);
                                      }
                                    }}
                                    className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                    data-testid="nav-logout"
                                  >
                                    <LogOut className="h-4 w-4" />
                                    <span>logout</span>
                                  </button>
                                </>
                              )}"""
        
        # Replace from the voice button to the end of the logout button
        # find logout end
        logout_end_idx = nav_start_idx
        while logout_end_idx < len(lines) and 'data-testid="nav-logout"' not in lines[logout_end_idx]:
            logout_end_idx += 1
        while logout_end_idx < len(lines) and '</button>' not in lines[logout_end_idx]:
            logout_end_idx += 1
            
        # Also clean up any extra closing fragments/parens we might have added incorrectly
        # We need to find the correct insertion point.
        
        # Actually, let's just use string.replace for the entire section if it's unique enough.
        # I'll use the markers I see in the file.
        
        content = "\\n".join(lines[:nav_start_idx]) + "\\n" + new_nav_content + "\\n" + "\\n".join(lines[logout_end_idx+1:])
        
        # Clean up the double fragments at the end of the section
        content = re.sub(r'</>\\s*\\)\\s*</>\\s*\\)\\s*', '</>\\n                          )}\\n', content)

with open(file_path, 'w') as f:
    f.write(content)
