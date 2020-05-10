
Local node repositories
=======================
The scenario this tool deals with is when we have a workspace that sometimes/
often/occasionally want to extend or modify a dependent package, as part of 
the work within the workspace. 

We want to work incrementally, with the package, within the project, without 
continously giving a new version to the package, publishing it, updating 
our dependecy and version list, and reinstalling packages. We want to work 
with version control, step by step, in the dependent module, at the same time 
as we use/consume our modifications in the scope of the workspace. 

When that work settles, when it is tested to the extent it can be, then it is 
time for the version increment, publish and package update cycle, in the work-
space. 

So this tool can temporarily (or for a longer time) convert an NPM package 
dependency to a local version controlled repository (GIT), allow for work 
being done in that repository, while consuming the package exactly the same
way, in workspace code. 

Commands
========
lnr init    
lnr fetch [-b/--bind] <repository link>
lnr bind [-l/--local -r/--recursive] <package name>
lnr unbind [-o/--old_version] [-p/--package_version] [-v/--version version_number] <package name>
lnr drop <package name>
lnr status 
lnr install [-f/--fetch_only]   # This both fetches repso and binds them into package.json:s.

Directory and state files
=========================
Local repositories are imported into the "lnr" directory. 

The state files of this tool are:
  lnr.json         # The list of Node repositories fetched locally and their "bind" state.
  lnr-local.json   # The same as above, but the intention here is to keep this file outside
                   # of the workspace VCS, so that a developer can work with local modules
                   # temporarily, without this being reflexted in others VCS controlled 
                   # work spaces.  

