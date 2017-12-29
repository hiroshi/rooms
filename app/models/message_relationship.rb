class MessageRelationship < ApplicationRecord
  belongs_to :parent, class_name: 'Message'
  belongs_to :child, class_name: 'Message'
end
