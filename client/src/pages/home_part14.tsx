                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Angel One Connection</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Automatic TOTP authentication - No daily token refresh needed</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>✅ Angel One SmartAPI:</strong> Free API with automatic authentication. Perfect for real-time trading and market data.
                        </p>
                      </div>
                      <AuthButtonAngelOne />
                    </div>
                  </div>
                </div>

                {/* SignIn Data Window with YouTube Link */}
                <SigninDataWindow />

                {/* Angel One Status */}
                <AngelOneStatus />

                {/* Live Market Prices - BANKNIFTY, SENSEX, GOLD with WebSocket status */}
                <AngelOneLiveMarketPrices />

                {/* Angel One API Statistics */}
                <AngelOneApiStatistics />

                {/* Angel One System Status and Recent Activity */}
                <AngelOneSystemStatus />

              </div>
            )}

            {activeTab === "trading-home" && (
              <div className="relative min-h-screen overflow-hidden">
                {/* Navigation Menu - Behind the home screen */}
                <div className="fixed inset-0 bg-gradient-to-b from-blue-800 to-blue-900 z-10 flex items-start justify-end pt-20 px-0 md:items-center md:justify-center md:pt-0 md:px-6">
                  <div className="w-auto md:w-full md:max-w-sm space-y-6 pr-4 md:pr-0">
                    {currentUser.userId ? (
                      <>
                        {/* User Profile Section - Horizontal Layout */}
                        <div className="flex items-center gap-4 pb-2">
                          <Avatar className="w-14 h-14 border-2 border-white/20">
                            <AvatarImage src={currentUser?.profilePicUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-xl">
                              {(currentUser?.displayName || currentUser?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <p className="text-white font-semibold text-base">
                              {currentUser.displayName && currentUser.displayName !== "Not available" ? currentUser.displayName : (currentUser.username && !currentUser.username.includes("@") ? currentUser.username : "")}
                            </p>
                            <p className="text-blue-200 text-sm">
                               {currentUser.username && !currentUser.username.includes("@") ? `@${currentUser.username}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Navigation Menu Items - Left aligned */}
                        <div className="space-y-3 flex flex-col">
                          <button
                            onClick={() => { if (isEditingUsername || isEditingDisplayName || isEditingDob || isEditingLocation) { setIsEditingUsername(false); setIsEditingDisplayName(false); setIsEditingDob(false); setIsEditingLocation(false); } else { setIsProfileActive(!isProfileActive); } }}
                            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-between"
                            data-testid="nav-profile"
                          >
                            <span>profile</span>
                            {isEditingUsername || isEditingDisplayName || isEditingDob || isEditingLocation ? ( <X className="h-4 w-4" /> ) : ( <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileActive ? "rotate-180" : ""}`} /> )}
                          </button>
                          
                          {isProfileActive && (
                            <div className="px-4 py-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">username</span>
                                {isEditingUsername ? (
                                  <div className="relative flex items-center gap-2">
                                    <div className="relative w-full">
                                      <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-white pr-10 w-full" autoFocus />
                                      <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ username: newUsername }); setIsEditingUsername(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-all z-10">
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.username || "Not available"}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNewUsername(currentUser?.username || "");
                                        setIsEditingUsername(true);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded-md transition-all"
                                    >
                                      <Pencil className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">display name</span>
                                {isEditingDisplayName ? (
                                  <div className="relative flex items-center gap-2">
                                    <div className="relative w-full">
                                      <Input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-white pr-10 w-full" autoFocus />
                                      <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ displayName: newDisplayName }); setIsEditingDisplayName(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-all z-10">
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.displayName && currentUser.displayName !== "Not available" ? currentUser.displayName : ""}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewDisplayName(currentUser?.displayName || ""); setIsEditingDisplayName(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">email id</span>
                                <span className="text-white font-medium">{currentUser?.email && currentUser.email !== "empty" ? currentUser.email : ""}</span>
                              </div>
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">dob</span>
                                {isEditingDob ? (
                                  <div className="relative flex items-center group">
                                    <Input
                                      type="date"
                                      value={newDob}
                                      onChange={(e) => setNewDob(e.target.value)}
                                      className="h-9 bg-gray-800 border-gray-700 text-white pr-10 focus:ring-1 focus:ring-blue-500"
                                      autoFocus
                                      onKeyDown={async (e) => {
                                        if (e.key === "Enter") {
                                          e.stopPropagation();
                                          await handleUpdateProfile({ dob: newDob });
                                          setIsEditingDob(false);
                                        } else if (e.key === "Escape") {
                                          setIsEditingDob(false);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await handleUpdateProfile({ dob: newDob });
                                        setIsEditingDob(false);
                                      }}
                                      className="absolute right-2 p-1 hover:bg-white/10 rounded-md transition-all"
                                      data-testid="button-save-dob"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.dob ? currentUser.dob.split("-").reverse().join("-") : "empty"}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewDob(currentUser?.dob || ""); setIsEditingDob(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">location</span>
                                {isEditingLocation ? (
                                  <div className="relative flex items-center group">
                                    <Input
                                      value={newLocation}
                                      onChange={(e) => setNewLocation(e.target.value)}
                                      className="h-9 bg-gray-800 border-gray-700 text-white pr-10 focus:ring-1 focus:ring-blue-500"
                                      autoFocus
                                      onKeyDown={async (e) => {
                                        if (e.key === "Enter") {
                                          e.stopPropagation();
                                          await handleUpdateProfile({ location: newLocation });
                                          setIsEditingLocation(false);
                                        } else if (e.key === "Escape") {
                                          setIsEditingLocation(false);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await handleUpdateProfile({ location: newLocation });
                                        setIsEditingLocation(false);
                                      }}
                                      className="absolute right-2 p-1 hover:bg-white/10 rounded-md transition-all"
                                      data-testid="button-save-location"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.location && currentUser.location !== "empty" ? currentUser.location : ""}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewLocation(currentUser?.location || ""); setIsEditingLocation(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {!isProfileActive && (
                            <>
                              <button
                                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                data-testid="nav-voice"
                              >
                                Voice
                              </button>
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
                          )}
                        </div>
                      </>
                    ) : (<div className="flex flex-col items-center justify-center space-y-4">
                        <button
                          onClick={() => {
                            window.location.href = "/login";
                          }}
                          className="w-full px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-center"
                          data-testid="nav-login"
                        >
                          Login
                        </button>
                      </div>
                    )}
                  </div>
                </div>



                {/* Two-line Hamburger Icon - Mobile only - Theme responsive - Fixed position */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNavOpen(!isNavOpen);
                  }}
                  className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all duration-300"
                  data-testid="button-nav-toggle"
                >
                  <div
                    className={`h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isNavOpen ? "w-5 rotate-45 translate-y-1" : "w-5"}`}
                  ></div>
                  <div
                    className={`h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isNavOpen ? "w-5 -rotate-45 -translate-y-1" : "w-4 ml-1"}`}
