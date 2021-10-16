# Jezzball

## [Play on GitHub Pages](https://hypothete.github.io/jezzball/)

Jezzball is a simple video game that came bundled with Windows 95. The goal of the game is to partition the playing field by left and right clicking, until the bouncing balls were contained to 25% of the playing field or less.

I implemented the game in order to learn how applying cuts to the grid worked. It turns out to be simpler than it looks. When a cut is complete, flood-fill the grid from each ball's position and write the resulting shapes to a new grid. Then once all of the balls have been checked, swap out the old grid for the new grid.
