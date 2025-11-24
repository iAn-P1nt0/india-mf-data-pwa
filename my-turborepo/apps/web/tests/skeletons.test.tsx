import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  FundCardSkeleton,
  FundListSkeleton,
  ChartSkeleton,
  MetricsSkeleton,
  TableSkeleton,
  InputSkeleton,
  ButtonSkeleton,
} from '@/components/common/Skeletons';

describe('Skeleton Components', () => {
  it('renders FundCardSkeleton with animation', () => {
    const { container } = render(<FundCardSkeleton />);
    const animatedDiv = container.querySelector('.animate-pulse');
    expect(animatedDiv).toBeInTheDocument();
    expect(container.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(0);
  });

  it('renders FundListSkeleton with multiple cards', () => {
    const { container } = render(<FundListSkeleton />);
    const skeletons = container.querySelectorAll('.bg-white.rounded-lg');
    expect(skeletons.length).toBe(5);
  });

  it('renders ChartSkeleton with title and chart area', () => {
    const { container } = render(<ChartSkeleton />);
    const elements = container.querySelectorAll('.bg-gray-200, .bg-gray-100');
    expect(elements.length).toBeGreaterThan(0);
    const animatedDiv = container.querySelector('.animate-pulse');
    expect(animatedDiv).toBeInTheDocument();
  });

  it('renders MetricsSkeleton with grid layout', () => {
    const { container } = render(<MetricsSkeleton />);
    const metrics = container.querySelectorAll('.bg-white.rounded-lg');
    expect(metrics.length).toBe(4);
    const animatedDiv = container.querySelector('.animate-pulse');
    expect(animatedDiv).toBeInTheDocument();
  });

  it('renders TableSkeleton with rows', () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
    const tableElement = container.querySelector('table');
    expect(tableElement).toBeInTheDocument();
  });

  it('renders InputSkeleton with proper dimensions', () => {
    const { container } = render(<InputSkeleton />);
    const skeleton = container.querySelector('.h-10');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders ButtonSkeleton with proper dimensions', () => {
    const { container } = render(<ButtonSkeleton />);
    const skeleton = container.querySelector('.h-10.bg-gray-300');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('skeletons use consistent animation classes', () => {
    const { container: fundContainer } = render(<FundCardSkeleton />);
    const { container: chartContainer } = render(<ChartSkeleton />);
    const { container: metricsContainer } = render(<MetricsSkeleton />);
    const { container: inputContainer } = render(<InputSkeleton />);

    expect(fundContainer.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(chartContainer.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(metricsContainer.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(inputContainer.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
