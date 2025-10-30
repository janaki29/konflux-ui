import * as React from 'react';
import {
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  List,
  ListItem,
  ModalVariant,
} from '@patternfly/react-core';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { ExternalLink } from '~/shared';
import { GITHUB_REPOSITORY_URL, KEY_FEATURES_LIST_ITEMS, OFFICIAL_WEBSITE_URL } from './const';

const AboutModal: React.FC = () => {
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData?.visibility === 'private';
  const documentationURL = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;

  const RESOURCES_LIST_ITEMS = [
    { url: documentationURL, text: 'Documentation' },
    { url: GITHUB_REPOSITORY_URL, text: 'GitHub Repository' },
    { url: OFFICIAL_WEBSITE_URL, text: 'Official Website' },
  ];

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.p}>
            Konflux is a comprehensive platform for modern application development and deployment.
            It provides developers with the tools and infrastructure needed to build, test and
            deploy applications efficiently in cloud-native environments.
          </Text>
        </TextContent>
      </StackItem>

      <StackItem>
        <TextContent>
          <Text component={TextVariants.h3}>Key Features</Text>
        </TextContent>
        <List>
          {KEY_FEATURES_LIST_ITEMS.map((item) => (
            <ListItem key={item}>
              <Text component={TextVariants.p}>{item}</Text>
            </ListItem>
          ))}
        </List>
      </StackItem>

      <StackItem>
        <TextContent>
          <Text component={TextVariants.h3}>Resources</Text>
        </TextContent>
        <List>
          {RESOURCES_LIST_ITEMS.map((item) => (
            <ListItem key={item.text}>
              <ExternalLink href={item.url} text={item.text} />
            </ListItem>
          ))}
        </List>
      </StackItem>

      <StackItem>
        <TextContent>
          <Text component={TextVariants.small}>Konflux UI - Built with React and Patternfly</Text>
        </TextContent>
      </StackItem>
    </Stack>
  );
};

export const createAboutModal = createModalLauncher(AboutModal, {
  'data-test': 'about-modal',
  title: 'About Konflux',
  variant: ModalVariant.medium,
});

export default AboutModal;
