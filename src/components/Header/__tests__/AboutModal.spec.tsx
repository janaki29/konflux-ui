import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutModal, { createAboutModal } from '../AboutModal';

// Mock the documentation constants
jest.mock('~/consts/documentation', () => ({
  EXTERNAL_DOCUMENTATION_BASE_URL: 'https://external-docs.example.com',
  INTERNAL_DOCUMENTATION_BASE_URL: 'https://internal-docs.example.com',
}));

// Mock the header constants
jest.mock('../const', () => ({
  GITHUB_REPOSITORY_URL: 'https://github.com/example/konflux',
  OFFICIAL_WEBSITE_URL: 'https://konflux.example.com',
  KEY_FEATURES_LIST_ITEMS: [
    'Application lifecycle management',
    'Pipeline Automation and CI/CD',
    'Component-based development',
    'Release Management',
    'Security scanning and compliance',
    'Integration with modern development tools',
  ],
}));

// Mock the useKonfluxPublicInfo hook
const mockUseKonfluxPublicInfo = jest.fn();
jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: () => mockUseKonfluxPublicInfo(),
}));

// Mock ExternalLink component
jest.mock('~/shared', () => ({
  ExternalLink: ({ href, text }: { href: string; text: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={`external-link-${text.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {text}
    </a>
  ),
}));

describe('AboutModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'public' }]);
  });

  describe('Modal Content Rendering', () => {
    it('should render the content component', () => {
      render(<AboutModal />);

      expect(
        screen.getByText(/Konflux is a comprehensive platform for modern application development/),
      ).toBeInTheDocument();
    });

    it('should display the description text', () => {
      render(<AboutModal />);

      expect(
        screen.getByText(/Konflux is a comprehensive platform for modern application development/),
      ).toBeInTheDocument();
    });
  });

  describe('Key Features Section', () => {
    it('should display "Key Features" heading', () => {
      render(<AboutModal />);

      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    it('should display all key features', () => {
      render(<AboutModal />);

      const expectedFeatures = [
        'Application lifecycle management',
        'Pipeline Automation and CI/CD',
        'Component-based development',
        'Release Management',
        'Security scanning and compliance',
        'Integration with modern development tools',
      ];

      expectedFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('should render key features as a list', () => {
      render(<AboutModal />);

      // Find the list directly by role, which is more reliable
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThanOrEqual(1); // There are at least 2 lists: key features and resources
    });
  });

  describe('Resources Section', () => {
    it('should display "Resources" heading', () => {
      render(<AboutModal />);

      expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('should display external documentation link for public visibility', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'public' }]);
      render(<AboutModal />);

      const docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docLink).toBeInTheDocument();
      expect(docLink).toHaveAttribute('href', 'https://external-docs.example.com');
    });

    it('should display internal documentation link for private visibility', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'private' }]);
      render(<AboutModal />);

      const docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docLink).toBeInTheDocument();
      expect(docLink).toHaveAttribute('href', 'https://internal-docs.example.com');
    });

    it('should display GitHub repository link', () => {
      render(<AboutModal />);

      const githubLink = screen.getByRole('link', { name: /GitHub Repository/i });
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute('href', 'https://github.com/example/konflux');
    });

    it('should display official website link', () => {
      render(<AboutModal />);

      const websiteLink = screen.getByRole('link', { name: /Official Website/i });
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink).toHaveAttribute('href', 'https://konflux.example.com');
    });

    it('should render resources as external links with proper attributes', () => {
      render(<AboutModal />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Version Information', () => {
    it('should display version information', () => {
      render(<AboutModal />);

      expect(screen.getByText(/Konflux UI /)).toBeInTheDocument();
      expect(screen.getByText(/Built with React and Patternfly/)).toBeInTheDocument();
    });
  });

  describe('Modal Launcher', () => {
    it('should create a modal launcher function', () => {
      expect(typeof createAboutModal).toBe('function');
    });

    it('should create modal launcher with correct configuration', () => {
      const launcher = createAboutModal();
      expect(typeof launcher).toBe('function');
    });
  });

  describe('Visibility-based Behavior', () => {
    it('should default to external documentation when visibility is undefined', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{}]);
      render(<AboutModal />);

      // Check for any link with external-docs URL instead of specific testid
      const docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docLink).toHaveAttribute('href', 'https://external-docs.example.com');
    });

    it('should handle null Konflux public info gracefully', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([null]);

      expect(() => render(<AboutModal />)).not.toThrow();

      const docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docLink).toHaveAttribute('href', 'https://external-docs.example.com');
    });

    it('should handle missing parsedData gracefully', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([undefined]);

      expect(() => render(<AboutModal />)).not.toThrow();
    });
  });

  describe('Content Structure', () => {
    it('should have proper semantic structure', () => {
      render(<AboutModal />);

      // Check for proper headings hierarchy (no modal wrapper in this component)
      const keyFeaturesHeading = screen.getByRole('heading', { name: 'Key Features' });
      const resourcesHeading = screen.getByRole('heading', { name: 'Resources' });

      expect(keyFeaturesHeading).toBeInTheDocument();
      expect(resourcesHeading).toBeInTheDocument();
    });

    it('should have accessible content organization', () => {
      render(<AboutModal />);

      // Check that content is properly organized in lists
      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2); // Key features list and resources list
    });
  });

  describe('Integration with External Dependencies', () => {
    it('should integrate properly with ExternalLink component', () => {
      render(<AboutModal />);

      // Verify that ExternalLink components are rendered with correct props
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      // Each link should have proper external link attributes
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should handle changes in Konflux public info', () => {
      const { rerender } = render(<AboutModal />);

      // Initially external
      let docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docLink).toHaveAttribute('href', 'https://external-docs.example.com');

      // Change to internal
      mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'private' }]);
      rerender(<AboutModal />);

      docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docLink).toHaveAttribute('href', 'https://internal-docs.example.com');
    });
  });
});
