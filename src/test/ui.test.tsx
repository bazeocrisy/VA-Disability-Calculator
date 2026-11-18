import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import { FLAG_GEOMETRY, FLAG_STAR_COUNT } from '../components/AmericanFlag';
import { BRANCHES } from '../components/Hero';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('App', () => {
  it('shows the hero headline, both CTAs, and the independence disclaimer', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/You served\.\s*You earned it\./i);
    expect(screen.getByText('Know Your Rating. Understand Your Benefits. Calculate Your Compensation.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Calculate My VA Compensation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Calculate My Combined Rating' })).toBeTruthy();
    expect(
      screen.getByText('Independent veteran resource. Not affiliated with the U.S. Department of Veterans Affairs.'),
    ).toBeTruthy();
  });

  it('represents all six branches', () => {
    render(<App />);
    const list = screen.getByRole('list', { name: /six branches/i });
    const names = within(list).getAllByRole('listitem').map((li) => li.textContent);
    for (const b of ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Coast Guard', 'Space Force']) {
      expect(names.some((n) => n?.includes(b))).toBe(true);
    }
    expect(BRANCHES).toHaveLength(6);
  });

  it('labels the hero artwork placeholder honestly until reviewed art exists', () => {
    render(<App />);
    expect(screen.getByRole('img', { name: /Placeholder for hero artwork/i })).toBeTruthy();
  });

  it('labels 2026 official and 2027 PROJECTED results with dates', () => {
    render(<App />);
    expect(screen.getByText('Official VA rate')).toBeTruthy();
    expect(screen.getByText('PROJECTED')).toBeTruthy();
    expect(screen.getByText(/not an official VA rate/)).toBeTruthy();
    expect(screen.getAllByText(/Nov 18, 2026|2026-11-18/).length).toBeGreaterThan(0);
  });

  it('computes the default 70% veteran-alone amount and updates on input', () => {
    render(<App />);
    expect(screen.getAllByText('$1,808.45').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText('100%'));
    expect(screen.getAllByText('$3,938.58').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText('Married'));
    expect(screen.getAllByText('$4,158.17').length).toBeGreaterThan(0);
  });

  it('shows a warning and no amount for SMC', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText(/Special Monthly Compensation/));
    expect(screen.getAllByText('No estimate shown.').length).toBe(2);
    expect(screen.queryByText('$1,808.45')).toBeNull();
  });

  it('tabs: keyboard arrows move between sections', () => {
    render(<App />);
    const tab = screen.getByRole('tab', { name: 'Quick Pay' });
    tab.focus();
    fireEvent.keyDown(tab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Combined Rating' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Combined Disability Rating Calculator' })).toBeTruthy();
  });

  it('combined rating defaults to 50/30/20 → 70% and can feed Quick Pay', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Combined Rating' }));
    expect(screen.getByText('70%', { selector: '.combined-hero__value' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Use 70% in the compensation calculator/ }));
    expect(screen.getByRole('tab', { name: 'Quick Pay' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('American flag', () => {
  it('has 50 stars and official proportions', () => {
    expect(FLAG_STAR_COUNT).toBe(50);
    expect(FLAG_GEOMETRY.B / FLAG_GEOMETRY.A).toBeCloseTo(1.9);
    expect(FLAG_GEOMETRY.C / FLAG_GEOMETRY.A).toBeCloseTo(7 / 13);
    expect(FLAG_GEOMETRY.D / FLAG_GEOMETRY.A).toBeCloseTo(0.76);
  });
  it('renders 7 red stripes', () => {
    const { container } = render(<App />);
    const svg = container.querySelector('.hero__flag-svg')!;
    expect(svg.querySelectorAll('rect[fill="#B22234"]').length).toBe(7);
  });
});
