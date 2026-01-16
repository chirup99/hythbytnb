import sys

filepath = 'client/src/pages/home.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Locate the voice profiles section
# We'll look for the list of IDs which is unique
start_marker = 'id: "samantha"'
end_marker = 'Select a voice for your minicast'

start_pos = content.find(start_marker)
if start_pos == -1:
    print("Start marker not found")
    sys.exit(1)

# Backtrack to the start of the JSX expression/list
# It likely starts with {[ or just [
while start_pos > 0 and content[start_pos] not in ['[', '{']:
    start_pos -= 1

# Find the end of the section
end_pos = content.find(end_marker, start_pos)
if end_pos == -1:
    print("End marker not found")
    sys.exit(1)

# Look for the last closing div of the profiles container before the label
end_pos = content.rfind('</div>', start_pos, end_pos)
if end_pos == -1:
    print("Closing div not found")
    sys.exit(1)
end_pos += 6

prefix = content[:start_pos]
suffix = content[end_pos:]

# Clean middle section with proper logic
middle = """[
                                        { id: "samantha", name: "Samantha", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samantha" },
                                        { id: "amro", name: "Amro", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
                                        { id: "heera", name: "Heera", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
                                        { id: "add", name: "Add", isAdd: true }
                                      ].map((profile) => {
                                        const isSelected = typeof activeVoiceProfileId !== "undefined" && activeVoiceProfileId === profile.id;
                                        return (
                                          <div 
                                            key={profile.id} 
                                            className="flex flex-col items-center gap-1.5 group cursor-pointer" 
                                            onClick={() => {
                                              if (!profile.isAdd) {
                                                setActiveVoiceProfileId(profile.id);
                                                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                                  // STOP current speech
                                                  window.speechSynthesis.cancel();

                                                  const name = currentUser?.displayName || currentUser?.username || "Trader";
                                                  const utterance = new SpeechSynthesisUtterance(`Hello ${name}, I am ${profile.name}. How is your day? Welcome to perala!`);
                                                  const voices = window.speechSynthesis.getVoices();
                                                  
                                                  // Select distinctive voices
                                                  if (profile.id === "samantha") {
                                                    const v = voices.find(v => v.name.includes("Samantha") || v.name.includes("Female") || v.name.includes("Zira"));
                                                    if (v) utterance.voice = v;
                                                  } else if (profile.id === "amro") {
                                                    const v = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Google UK English Male"));
                                                    if (v) utterance.voice = v;
                                                  } else if (profile.id === "heera") {
                                                    const v = voices.find(v => v.name.includes("Hindi") || v.name.includes("India") || v.name.includes("Google UK English Female"));
                                                    if (v) utterance.voice = v;
                                                  }
                                                  
                                                  window.speechSynthesis.speak(utterance);
                                                }
                                              }
                                            }}
                                          >
                                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-105 ${isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-transparent"} active:scale-95 overflow-hidden bg-gray-700 shadow-lg`}>
                                              {profile.isAdd ? (
                                                <Plus className="h-5 w-5 text-gray-400" />
                                              ) : (
                                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                              )}
                                            </div>
                                            <span className={`text-[10px] font-medium transition-colors flex items-center gap-1 ${isSelected ? "text-blue-400 font-bold" : "text-gray-300 group-hover:text-blue-400"}`}>
                                              {profile.name} {isSelected && <Check className="h-2.5 w-2.5" />}
                                            </span>
                                          </div>
                                        );
                                      })
                                    </div>"""

with open(filepath, 'w') as f:
    f.write(prefix + middle + suffix)
print("Successfully repaired home.tsx")
